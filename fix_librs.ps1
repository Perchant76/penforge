# Run this PowerShell script from inside your penforge folder
# It deletes the broken lib.rs and writes the correct one

$librs = "src-tauri\src\lib.rs"
$content = @'
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
    bcrypt::verify(input, hash).map_err(|e| e.to_string())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running PenForge");
}
'@

Remove-Item -Force $librs -ErrorAction SilentlyContinue
[System.IO.File]::WriteAllText((Resolve-Path "src-tauri\src").Path + "\lib.rs", $content)

$lines = (Get-Content $librs).Count
Write-Host "✓ lib.rs written — $lines lines"

# Also nuke the build cache so Cargo starts fresh
if (Test-Path "src-tauri\target") {
    Remove-Item -Recurse -Force "src-tauri\target\debug\.fingerprint\penforge-*" -ErrorAction SilentlyContinue
    Write-Host "✓ Build cache cleared"
}
Write-Host "Now run: cargo tauri dev"
