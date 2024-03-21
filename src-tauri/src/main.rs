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

#[tauri::command]
fn read_file(file_path: String) -> Result<String, String> {
    // Attempt to read the file
    let parsed_path = file_path.replace("%user%", &whoami::username());
    match fs::read_to_string(&parsed_path) {
        // If successful, return the file contents as a string
        Ok(contents) => Ok(contents),
        // If an error occurs, return the error
        Err(error) => Err(format!("Error reading file: {} for path: {}", error, file_path))
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![list_dir, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
