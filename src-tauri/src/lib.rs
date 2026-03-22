// src-tauri/src/lib.rs
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn data_dir(app: &tauri::AppHandle, filename: &str) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(filename))
}

#[tauri::command]
fn read_json_file(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let p = data_dir(&app, &filename)?;
    if !p.exists() { return Ok(String::new()); }
    fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_json_file(app: tauri::AppHandle, filename: String, content: String) -> Result<(), String> {
    fs::write(data_dir(&app, &filename)?, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn hash_pin(pin: String) -> Result<String, String> {
    bcrypt::hash(pin, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())
}

#[tauri::command]
fn verify_pin(input: String, hash: String) -> Result<bool, String> {
    bcrypt::verify(input, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_ptsync(data: String, path: String) -> Result<(), String> {
    fs::write(path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_ptsync(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path().app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Write HTML report to a temp file and open it in the default browser.
/// The user can then use Ctrl+P / Cmd+P to save as PDF.
#[tauri::command]
fn open_report_in_browser(app: tauri::AppHandle, html: String) -> Result<String, String> {
    // Write to app data dir so it persists until user saves the PDF
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("penforge_report_preview.html");
    fs::write(&path, html).map_err(|e| e.to_string())?;
    let path_str = path.to_string_lossy().to_string();

    // Open with OS default browser
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &path_str])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(path_str)
}

/// Read a custom HTML template file from disk
#[tauri::command]
fn read_template_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Save a template definition to app data
#[tauri::command]
fn save_template(app: tauri::AppHandle, filename: String, content: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let templates_dir = dir.join("templates");
    fs::create_dir_all(&templates_dir).map_err(|e| e.to_string())?;
    fs::write(templates_dir.join(&filename), content).map_err(|e| e.to_string())
}

/// List all saved templates
#[tauri::command]
fn list_templates(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| format!("{}", e))?;
    let templates_dir = dir.join("templates");
    if !templates_dir.exists() { return Ok(vec![]); }
    let names: Vec<String> = fs::read_dir(&templates_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();
    Ok(names)
}

/// Delete a template
#[tauri::command]
fn delete_template(app: tauri::AppHandle, filename: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("templates").join(&filename);
    if path.exists() { fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_json_file,
            write_json_file,
            hash_pin,
            verify_pin,
            export_ptsync,
            import_ptsync,
            get_app_data_dir,
            open_report_in_browser,
            read_template_file,
            save_template,
            list_templates,
            delete_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PenForge");
}
