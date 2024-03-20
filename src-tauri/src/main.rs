// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<String>, String> {
    // Read the directory
    let parsed_path = path.replace("%user%", &whoami::username());
    let entries = match fs::read_dir(&parsed_path) {
        Ok(entries) => entries,
        Err(err) => return Err(format!("Failed to read directory {}: {}", parsed_path, err)),
    };

    // Collect folder names
    let mut folders = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                folders.push(name.to_string());
            }
        }
    }

    Ok(folders)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![list_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
