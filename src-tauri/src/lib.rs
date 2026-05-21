use serde::Serialize;
use std::{
    env,
    net::{Shutdown, TcpStream},
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, State};
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
    backend_started_at: Option<Instant>,
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
            backend_started_at: None,
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DevtunnelLoginEvent {
    status: String,      // "checking", "login_required", "login_url", "login_success", "login_failed"
    message: String,
    url: Option<String>, // login URL when status is "login_url"
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

    // Collect all candidate directories to check
    let mut candidates = Vec::new();

    // Check relative to the exe itself (NSIS installs put everything alongside the exe)
    if let Ok(current_exe) = env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            candidates.push(exe_dir.join("out"));
            candidates.push(exe_dir.join("_up_").join("out"));
        }
    }

    // Check Tauri resource directory and common subdirectory layouts
    let resource_dir = app
        .path()
        .resource_dir()
        .unwrap_or_else(|_| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    candidates.push(resource_dir.join("out"));
    candidates.push(resource_dir.join("_up_").join("out"));

    for candidate in &candidates {
        if candidate.exists() {
            return candidate.clone();
        }
    }

    // Final fallback - return the resource dir itself
    resource_dir
}

fn config_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_else(|_| env::temp_dir().join("termote"))
}

fn is_backend_ready() -> bool {
    match TcpStream::connect(("127.0.0.1", BACKEND_PORT)) {
        Ok(stream) => {
            let _ = stream.shutdown(Shutdown::Both);
            true
        }
        Err(_) => false,
    }
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

/// Kill any process currently listening on the given port.
/// Prevents stale backends from a previous session blocking our sidecar.
fn kill_processes_on_ports(ports: &[u16]) {
    use std::process::{Command, id};

    let my_pid = id().to_string();

    for &port in ports {
        let output = Command::new("netstat")
            .args(["-ano", "-p", "TCP"])
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let target = format!(":{}", port);
            for line in stdout.lines() {
                if line.contains(&target) && line.contains("LISTENING") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 5 {
                        let pid = parts[4];
                        if pid == my_pid {
                            continue;
                        }
                        println!("Killing stale process {} on port {}", pid, port);
                        let _ = Command::new("taskkill")
                            .args(["/F", "/T", "/PID", pid])
                            .output();
                    }
                }
            }
        }
    }
}

fn ensure_backend_running(app: &AppHandle, runtime: &State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let mut child_to_kill = None;
    let token = {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;

        if state.backend.is_some() {
            if is_backend_ready() {
                state.backend_running = true;
                return Ok(snapshot(&state));
            }

            let still_starting = state
                .backend_started_at
                .map(|started_at| started_at.elapsed() < Duration::from_secs(20))
                .unwrap_or(false);
            if still_starting {
                state.backend_running = false;
                return Ok(snapshot(&state));
            }

            child_to_kill = state.backend.take();
            state.backend_running = false;
            state.backend_started_at = None;
        }

        state.auth_token.clone()
    };

    if let Some(child) = child_to_kill {
        let _ = child.kill();
    }

    // Kill any stale backend process left on our port from a previous session/install.
    kill_processes_on_ports(&[BACKEND_PORT, 9091]);

    let frontend = frontend_dir(app);
    let config = config_dir(app);

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
        state.backend_running = false;
        state.backend_started_at = Some(Instant::now());
    }

    if let Err(error) = wait_for_backend() {
        let child = {
            let mut state = runtime.lock().map_err(|e| e.to_string())?;
            state.backend_running = false;
            state.backend_started_at = None;
            state.backend.take()
        };

        if let Some(child) = child {
            let _ = child.kill();
        }

        return Err(error);
    }

    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    state.backend_running = true;
    state.backend_started_at = None;
    Ok(snapshot(&state))
}

fn find_devtunnel(app: &AppHandle) -> Option<PathBuf> {
    if let Some(path) = env::var_os("DEVTUNNEL_PATH") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }

    let executable = if cfg!(windows) { "devtunnel.exe" } else { "devtunnel" };
    let mut bundled_candidates = Vec::new();

    if let Ok(current_exe) = env::current_exe() {
        if let Some(dir) = current_exe.parent() {
            bundled_candidates.push(dir.join(executable));
        }
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        bundled_candidates.push(resource_dir.join(executable));
    }
    #[cfg(windows)]
    {
        if let Ok(cwd) = env::current_dir() {
            let sidecar_name = "devtunnel-x86_64-pc-windows-msvc.exe";
            bundled_candidates.push(cwd.join("src-tauri").join("binaries").join(sidecar_name));
            bundled_candidates.push(cwd.join("binaries").join(sidecar_name));
            bundled_candidates.push(cwd.join("..").join("binaries").join(sidecar_name));
        }
    }

    if let Some(path) = bundled_candidates.into_iter().find(|path| path.exists()) {
        return Some(path);
    }

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

/// Extract a login/auth URL from devtunnel output.
/// The `devtunnel user login -g` command prints something like:
///   "To sign in, use a web browser to open the page https://... and enter the code ..."
fn parse_login_url(text: &str) -> Option<String> {
    // Look for any https:// URL in the output (device code login page)
    for word in text.split_whitespace() {
        let trimmed = word.trim_end_matches(|c: char| c == '.' || c == ',' || c == ';');
        if trimmed.starts_with("https://") && (trimmed.contains("microsoft") || trimmed.contains("login") || trimmed.contains("devicelogin") || trimmed.contains("aka.ms")) {
            return Some(trimmed.to_string());
        }
    }
    None
}

fn emit_login_event(app: &AppHandle, status: &str, message: &str, url: Option<String>) {
    let _ = app.emit("devtunnel-login-status", DevtunnelLoginEvent {
        status: status.to_string(),
        message: message.to_string(),
        url,
    });
}

async fn collect_command_output(
    app: &AppHandle,
    program: &PathBuf,
    args: Vec<String>,
    timeout_duration: Duration,
) -> Result<String, String> {
    let (mut rx, child) = app
        .shell()
        .command(program.to_string_lossy().to_string())
        .args(args)
        .spawn()
        .map_err(|e| format!("Failed to start Dev Tunnels CLI: {e}"))?;

    let started_at = Instant::now();
    let mut output = String::new();

    while started_at.elapsed() < timeout_duration {
        match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Some(CommandEvent::Stdout(line))) | Ok(Some(CommandEvent::Stderr(line))) => {
                output.push_str(&String::from_utf8_lossy(&line));
            }
            Ok(Some(CommandEvent::Error(error))) => {
                output.push_str(&error);
            }
            Ok(Some(CommandEvent::Terminated(_))) | Ok(None) => {
                return Ok(output);
            }
            Ok(Some(_)) | Err(_) => {}
        }
    }

    let _ = child.kill();
    Err(format!("Dev Tunnels CLI timed out. Output: {}", output.trim()))
}

async fn ensure_devtunnel_signed_in(app: &AppHandle, devtunnel: &PathBuf) -> Result<(), String> {
    // Step 1: Check if already logged in
    emit_login_event(app, "checking", "Checking Dev Tunnel authentication...", None);

    let show_output = collect_command_output(
        app,
        devtunnel,
        vec!["user".to_string(), "show".to_string()],
        Duration::from_secs(15),
    )
    .await?;

    let lower = show_output.to_ascii_lowercase();
    let needs_login = lower.contains("not logged in") || lower.contains("expired");

    if !needs_login {
        emit_login_event(app, "login_success", "Already signed in to Dev Tunnels.", None);
        return Ok(());
    }

    // Step 2: Need to login - run devtunnel user login -g and watch for the URL
    emit_login_event(app, "login_required", "Dev Tunnels login required. Starting device code flow...", None);

    let (mut rx, child) = app
        .shell()
        .command(devtunnel.to_string_lossy().to_string())
        .args(["user", "login", "-g"])
        .spawn()
        .map_err(|e| format!("Failed to start devtunnel login: {e}"))?;

    let started_at = Instant::now();
    let login_timeout = Duration::from_secs(180);
    let mut login_output = String::new();
    let mut url_opened = false;

    while started_at.elapsed() < login_timeout {
        match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Some(CommandEvent::Stdout(line))) | Ok(Some(CommandEvent::Stderr(line))) => {
                let text = String::from_utf8_lossy(&line);
                log::info!("[devtunnel-login] {}", text);
                login_output.push_str(&text);

                // Try to extract and open the login URL
                if !url_opened {
                    if let Some(login_url) = parse_login_url(&login_output) {
                        log::info!("[devtunnel-login] Found login URL: {}", login_url);
                        emit_login_event(app, "login_url", "Please complete sign-in in your browser.", Some(login_url.clone()));

                        // Open the URL in the system browser
                        #[allow(deprecated)]
                        if let Err(e) = tauri_plugin_shell::ShellExt::shell(app).open(&login_url, None::<tauri_plugin_shell::open::Program>) {
                            log::warn!("[devtunnel-login] Failed to open browser: {}", e);
                        }
                        url_opened = true;
                    }
                }
            }
            Ok(Some(CommandEvent::Error(error))) => {
                log::error!("[devtunnel-login] {}", error);
                login_output.push_str(&error);
            }
            Ok(Some(CommandEvent::Terminated(_))) | Ok(None) => {
                break;
            }
            Ok(Some(_)) | Err(_) => {}
        }
    }

    // If we timed out, kill the process
    if started_at.elapsed() >= login_timeout {
        let _ = child.kill();
    }

    // Step 3: Verify login succeeded
    let verify_output = collect_command_output(
        app,
        devtunnel,
        vec!["user".to_string(), "show".to_string()],
        Duration::from_secs(15),
    )
    .await?;

    let verify_lower = verify_output.to_ascii_lowercase();
    if verify_lower.contains("not logged in") || verify_lower.contains("expired") {
        emit_login_event(app, "login_failed", "Dev Tunnels sign-in did not complete.", None);
        return Err(format!(
            "Dev Tunnels sign-in did not complete. Please try again. Output: {}",
            login_output.trim()
        ));
    }

    emit_login_event(app, "login_success", "Successfully signed in to Dev Tunnels!", None);
    Ok(())
}

#[tauri::command]
fn get_runtime_state(runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let mut state = runtime.lock().map_err(|e| e.to_string())?;
    state.backend_running = state.backend.is_some() && is_backend_ready();
    Ok(snapshot(&state))
}

#[tauri::command]
fn check_status(runtime: State<'_, Mutex<RuntimeState>>) -> Result<bool, String> {
    let mut child_to_kill = None;
    let running = {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        let ready = state.backend.is_some() && is_backend_ready();

        if ready {
            state.backend_running = true;
            state.backend_started_at = None;
            true
        } else {
            let still_starting = state
                .backend_started_at
                .map(|started_at| started_at.elapsed() < Duration::from_secs(20))
                .unwrap_or(false);

            state.backend_running = false;
            if state.backend.is_some() && !still_starting {
                child_to_kill = state.backend.take();
                state.backend_started_at = None;
            }
            false
        }
    };

    if let Some(child) = child_to_kill {
        let _ = child.kill();
    }

    Ok(running)
}

#[tauri::command]
fn start_server(app: AppHandle, runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    ensure_backend_running(&app, &runtime)
}

#[tauri::command]
fn stop_server(runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let child = {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        state.backend_running = false;
        state.backend_started_at = None;
        state.backend.take()
    };

    if let Some(child) = child {
        let _ = child.kill();
    }

    let state = runtime.lock().map_err(|e| e.to_string())?;
    Ok(snapshot(&state))
}

#[tauri::command]
fn restart_server(app: AppHandle, runtime: State<'_, Mutex<RuntimeState>>) -> Result<RuntimeSnapshot, String> {
    let child = {
        let mut state = runtime.lock().map_err(|e| e.to_string())?;
        state.backend_running = false;
        state.backend_started_at = None;
        state.backend.take()
    };

    if let Some(child) = child {
        let _ = child.kill();
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

    let devtunnel = find_devtunnel(&app).ok_or_else(|| {
        "Microsoft Dev Tunnels CLI was not found. Install it and ensure `devtunnel` is on PATH, or set DEVTUNNEL_PATH.".to_string()
    })?;

    ensure_devtunnel_signed_in(&app, &devtunnel).await?;

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
    let mut tunnel_output = String::new();
    while started_at.elapsed() < TUNNEL_POLL_TIMEOUT {
        match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Some(CommandEvent::Stdout(line))) | Ok(Some(CommandEvent::Stderr(line))) => {
                let text = String::from_utf8_lossy(&line);
                log::info!("[devtunnel] {}", text);
                tunnel_output.push_str(&text);
                if let Some(url) = parse_tunnel_url(&text) {
                    let mut state = runtime.lock().map_err(|e| e.to_string())?;
                    state.tunnel_url = Some(url);
                    return Ok(snapshot(&state));
                }
            }
            Ok(Some(CommandEvent::Error(error))) => {
                log::error!("[devtunnel] {}", error);
                tunnel_output.push_str(&error);
            }
            Ok(Some(CommandEvent::Terminated(payload))) => {
                let mut state = runtime.lock().map_err(|e| e.to_string())?;
                state.tunnel = None;
                state.tunnel_running = false;
                let output = tunnel_output.trim();
                if output.is_empty() {
                    return Err(format!("Dev Tunnel exited before publishing a URL: {:?}", payload));
                }
                return Err(format!("Dev Tunnel exited before publishing a URL: {}", output));
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
