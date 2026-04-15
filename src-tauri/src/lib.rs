use std::sync::Mutex;
use std::process::Command;
use tauri::State;

struct ServerState {
    running: bool,
    server_process: Option<std::process::Child>,
}

impl Default for ServerState {
    fn default() -> Self {
        Self {
            running: false,
            server_process: None,
        }
    }
}

fn get_backend_exe() -> String {
    // Check user's actual Termote project first - this is the real backend
    let termote_project_exe = "C:\\Users\\alish\\termote\\target\\release\\termote.exe";
    if std::path::Path::new(termote_project_exe).exists() {
        return termote_project_exe.to_string();
    }

    // Fallback: check parent of current exe directory
    let exe_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .map(|p| p.join("termote.exe"));

    if let Some(path) = exe_path {
        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }

    // Fallback to fixed locations
    let locations = vec![
        "C:\\Users\\alish\\.termote-bin\\termote.exe",
    ];

    for loc in locations {
        if std::path::Path::new(loc).exists() {
            return loc.to_string();
        }
    }

    "termote.exe".to_string()
}

#[tauri::command]
fn check_status(state: State<'_, Mutex<ServerState>>) -> bool {
    let state = state.lock().unwrap();
    state.running
}

#[tauri::command]
fn start_server(state: State<'_, Mutex<ServerState>>) -> Result<String, String> {
    let mut state = state.lock().unwrap();

    if state.running {
        return Ok("Server already running".to_string());
    }

    let exe = get_backend_exe();
    log::info!("Starting Termote server: {}", exe);

    let child = Command::new(&exe)
        .spawn()
        .map_err(|e| format!("Failed to start server: {}", e))?;

    state.server_process = Some(child);
    state.running = true;

    log::info!("Termote server started successfully");
    Ok("Server started successfully".to_string())
}

#[tauri::command]
fn stop_server(state: State<'_, Mutex<ServerState>>) -> Result<String, String> {
    let mut state = state.lock().unwrap();

    if !state.running {
        return Ok("Server not running".to_string());
    }

    if let Some(mut child) = state.server_process.take() {
        child.kill().map_err(|e| format!("Failed to stop server: {}", e))?;
    }

    state.running = false;
    log::info!("Termote server stopped");
    Ok("Server stopped successfully".to_string())
}

#[tauri::command]
fn restart_server(state: State<'_, Mutex<ServerState>>) -> Result<String, String> {
    let exe = get_backend_exe();
    log::info!("Restarting Termote server: {}", exe);

    // Take the child process and clear state under the lock
    {
        let mut s = state.lock().unwrap();
        if let Some(mut c) = s.server_process.take() {
            let _ = c.kill();
        }
        s.running = false;
    }

    // Spawn new process
    let new_child = Command::new(&exe)
        .spawn()
        .map_err(|e| format!("Failed to restart server: {}", e))?;

    // Put child in state under lock
    let mut s = state.lock().unwrap();
    s.server_process = Some(new_child);
    s.running = true;

    Ok("Server restarted successfully".to_string())
}

#[tauri::command]
async fn check_for_updates() -> Result<String, String> {
    Ok("No updates available".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(ServerState::default()))
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_status,
            start_server,
            stop_server,
            restart_server,
            check_for_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}