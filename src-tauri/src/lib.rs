use serde::Serialize;
use std::{
    env,
    net::TcpStream,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

const BACKEND_PORT: u16 = 9090;
const BACKEND_SIDECAR: &str = "termote-backend";
const TUNNEL_POLL_TIMEOUT: Duration = Duration::from_secs(25);

struct RuntimeState {
    backend: Option<CommandChild>,
    tunnel: Option<CommandChild>,
    auth_token: String,
    tunnel_url: Option<String>,
    backend_running: bool,
    tunnel_running: bool,
}

impl Default for RuntimeState {
    fn default() -> Self {
        Self {
            backend: None,
            tunnel: None,
            auth_token: generate_token(),
            tunnel_url: None,
            backend_running: false,
            tunnel_running: false,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeSnapshot {
    backend_running: bool,
    tunnel_running: bool,
    backend_url: String,
    ws_url: String,
    auth_token: String,
    tunnel_url: Option<String>,
    mobile_url: String,
}

fn generate_token() -> String {
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64;

    let mut token = String::with_capacity(12);
    for _ in 0..12 {
        seed = seed.wrapping_mul(1103515245).wrapping_add(12345);
        let idx = (seed >> 16) as usize % CHARSET.len();
        token.push(CHARSET[idx] as char);
    }
    token
}

fn backend_url() -> String {
    format!("http://127.0.0.1:{}", BACKEND_PORT)
}

fn local_ws_url() -> String {
    format!("ws://127.0.0.1:{}/ws", BACKEND_PORT)
}

fn public_ws_url(http_url: &str) -> String {
    if http_url.starts_with("https://") {
        format!("wss://{}/ws", http_url.trim_start_matches("https://").trim_end_matches('/'))
    } else if http_url.starts_with("http://") {
        format!("ws://{}/ws", http_url.trim_start_matches("http://").trim_end_matches('/'))
    } else {
        http_url.to_string()
    }
}

fn mobile_url(tunnel_url: Option<&str>, token: &str) -> String {
    let base = tunnel_url.unwrap_or(&backend_url()).trim_end_matches('/').to_string();
    format!("{}/dashboard/?tunnel={}&token={}", base, urlencoding::encode(&public_ws_url(&base)), urlencoding::encode(token))
}

fn snapshot(state: &RuntimeState) -> RuntimeSnapshot {
    RuntimeSnapshot {
        backend_running: state.backend_running,
        tunnel_running: state.tunnel_running,
        backend_url: backend_url(),
        ws_url: state
            .tunnel_url
            .as_deref()
            .map(public_ws_url)
            .unwrap_or_else(local_ws_url),
        auth_token: state.auth_token.clone(),
        tunnel_url: state.tunnel_url.clone(),
        mobile_url: mobile_url(state.tunnel_url.as_deref(), &state.auth_token),
    }
}

fn frontend_dir(app: &AppHandle) -> PathBuf {
    if let Some(path) = env::var_os("TERMOTE_FRONTEND_DIR") {
        return PathBuf::from(path);
    }

    #[cfg(debug_assertions)]
    {
        if let Ok(cwd) = env::current_dir() {
            for candidate in [cwd.join("out"), cwd.join("..").join("out")] {
                if candidate.exists() {
                    return candidate;
                }
            }
        }
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .unwrap_or_else(|_| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let bundled_out = resource_dir.join("out");
    if bundled_out.exists() {
        bundled_out
    } else {
        resource_dir
    }
}

fn config_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_else(|_| env::temp_dir().join("termote"))
}

fn is_backend_ready() -> bool {
    TcpStream::connect(("127.0.0.1", BACKEND_PORT)).is_ok()
}

fn wait_for_backend() -> Result<(), String> {
    let start = Instant::now();
    while start.elapsed() < Duration::from_secs(15) {
        if is_backend_ready() {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    Err("Backend did not become ready within 15 seconds".to_string())
}

fn ensure_backend_running(app: &AppHandle, runtime: &State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        if state.backend_running && is_backend_ready() {
            return Ok(snapshot(&state));
        }

        if state.backend_running && !is_backend_ready() {
            state.backend = None;
            state.backend_running = false;
        }
    }

    let (token, frontend, config) = {
        let state = runtime.lock().map_err(|e| e.to_string())?;
        (state.auth_token.clone(), frontend_dir(app), config_dir(app))
    };

    std::fs::create_dir_all(&config).map_err(|e| format!("Failed to create config dir: {e}"))?;

    let command = app
        .shell()
        .sidecar(BACKEND_SIDECAR)
        .map_err(|e| format!("Failed to prepare backend sidecar: {e}"))?
        .args([
            "--port".to_string(),
            BACKEND_PORT.to_string(),
            "--frontend-dir".to_string(),
            frontend.to_string_lossy().to_string(),
        ])
        .env("AUTH_TOKEN", token)
        .env("TERMOTE_CONFIG_DIR", config.to_string_lossy().to_string());

    let (mut rx, child) = command
        .spawn()
        .map_err(|e| format!("Failed to start backend sidecar: {e}"))?;

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => log::info!("[backend] {}", String::from_utf8_lossy(&line)),
                CommandEvent::Stderr(line) => log::warn!("[backend] {}", String::from_utf8_lossy(&line)),
                CommandEvent::Error(error) => log::error!("[backend] {}", error),
                CommandEvent::Terminated(payload) => log::info!("[backend] terminated: {:?}", payload),
                _ => {}
            }
        }
    });

    {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        state.backend = Some(child);
        state.backend_running = true;
    }

    wait_for_backend()?;

    let state = runtime.lock().map_err(|e| e.to_string())?;
    Ok(snapshot(&state))
}

fn find_devtunnel() -> Option<PathBuf> {
    if let Some(path) = env::var_os("DEVTUNNEL_PATH") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }

    let executable = if cfg!(windows) { "devtunnel.exe" } else { "devtunnel" };
    if cfg!(windows) {
        if let Some(profile) = env::var_os("USERPROFILE") {
            let installed = PathBuf::from(profile).join("termote").join("bin").join(executable);
            if installed.exists() {
                return Some(installed);
            }
        }
    }

    env::var_os("PATH").and_then(|paths| {
        env::split_paths(&paths)
            .map(|path| path.join(executable))
            .find(|path| path.exists())
    })
}

fn parse_tunnel_url(line: &str) -> Option<String> {
    line.split_whitespace()
        .find(|part| part.starts_with("https://") && part.contains("devtunnels.ms"))
        .map(|part| part.trim_end_matches(|c: char| c == '.' || c == ',' || c == ';').to_string())
}

#[tauri::command]
fn get_runtime_state(runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let state = runtime.lock().map_err(|e| e.to_string())?;
    Ok(snapshot(&state))
}

#[tauri::command]
fn check_status(runtime: State<'_, Mutex<RuntimeState>>) -> Result<bool, String> {
    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    let running = state.backend_running && is_backend_ready();
    state.backend_running = running;
    if !running {
        state.backend = None;
    }
    Ok(running)
}

#[tauri::command]
fn start_server(app: AppHandle, runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    ensure_backend_running(&app, &runtime)
}

#[tauri::command]
fn stop_server(runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    if let Some(child) = state.backend.take() {
        let _ = child.kill();
    }
    state.backend_running = false;
    Ok(snapshot(&state))
}

#[tauri::command]
fn restart_server(app: AppHandle, runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        if let Some(child) = state.backend.take() {
            let _ = child.kill();
        }
        state.backend_running = false;
    }
    ensure_backend_running(&app, &runtime)
}

#[tauri::command]
async fn start_remote_access(app: AppHandle, runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    ensure_backend_running(&app, &runtime)?;

    {
        let state = runtime.lock().map_err(|e| e.to_string())?;
        if state.tunnel_running && state.tunnel_url.is_some() {
            return Ok(snapshot(&state));
        }
    }

    let devtunnel = find_devtunnel().ok_or_else(|| {
        "Microsoft Dev Tunnels CLI was not found. Install it and ensure `devtunnel` is on PATH, or set DEVTUNNEL_PATH.".to_string()
    })?;

    let command = app
        .shell()
        .command(devtunnel.to_string_lossy().to_string())
        .args([
            "host".to_string(),
            "-p".to_string(),
            BACKEND_PORT.to_string(),
            "--allow-anonymous".to_string(),
        ]);

    let (mut rx, child) = command
        .spawn()
        .map_err(|e| format!("Failed to start Dev Tunnel: {e}"))?;

    {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        state.tunnel = Some(child);
        state.tunnel_running = true;
        state.tunnel_url = None;
    }

    let started_at = Instant::now();
    while started_at.elapsed() < TUNNEL_POLL_TIMEOUT {
        match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Some(CommandEvent::Stdout(line))) | Ok(Some(CommandEvent::Stderr(line))) => {
                let text = String::from_utf8_lossy(&line);
                log::info!("[devtunnel] {}", text);
                if let Some(url) = parse_tunnel_url(&text) {
                    let mut state = runtime.lock().map_err(|e| e.to_string())?;
                    state.tunnel_url = Some(url);
                    return Ok(snapshot(&state));
                }
            }
            Ok(Some(CommandEvent::Error(error))) => log::error!("[devtunnel] {}", error),
            Ok(Some(CommandEvent::Terminated(payload))) => {
                let mut state = runtime.lock().map_err(|e| e.to_string())?;
                state.tunnel = None;
                state.tunnel_running = false;
                return Err(format!("Dev Tunnel exited before publishing a URL: {:?}", payload));
            }
            Ok(Some(_)) | Err(_) => {}
            Ok(None) => return Err("Dev Tunnel process ended before URL was available".to_string()),
        }
    }

    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    if let Some(child) = state.tunnel.take() {
        let _ = child.kill();
    }
    state.tunnel_url = None;
    state.tunnel_running = false;
    Err("Timed out waiting for Dev Tunnel URL".to_string())
}

#[tauri::command]
fn stop_remote_access(runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    if let Some(child) = state.tunnel.take() {
        let _ = child.kill();
    }
    state.tunnel_url = None;
    state.tunnel_running = false;
    Ok(snapshot(&state))
}

#[tauri::command]
async fn check_for_updates() -> Result<String, String> {
    Ok("Updates are handled by the installed desktop app release.".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(RuntimeState::default()))
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_runtime_state,
            check_status,
            start_server,
            stop_server,
            restart_server,
            start_remote_access,
            stop_remote_access,
            check_for_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
