// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::fs::File;

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
        Err(error) => Err(format!(
            "Error reading file: {} for path: {}",
            error, file_path
        )),
    }
}

#[tauri::command]
fn extract_zip(zip_path: String, extract_path: String) -> Result<(), String> {
    let parsed_zip_path = zip_path.replace("%user%", &whoami::username());
    let parsed_extract_path = extract_path.replace("%user%", &whoami::username());

    // Open the zip file
    let zip_file = match File::open(&parsed_zip_path) {
        Ok(file) => file,
        Err(error) => {
            return Err(format!(
                "Error opening zip file: {} for path: {}",
                error, parsed_zip_path
            ))
        }
    };

    // Create a zip archive from the file
    let mut zip_archive = match zip::ZipArchive::new(zip_file) {
        Ok(archive) => archive,
        Err(error) => {
            return Err(format!(
                "Error creating zip archive: {} for path: {}",
                error, parsed_zip_path
            ))
        }
    };

    // Extract the contents of the zip archive
    match zip_archive.extract(&parsed_extract_path) {
        Ok(_) => Ok(()),
        Err(error) => Err(format!(
            "Error extracting zip archive: {} for path: {}",
            error, parsed_extract_path
        )),
    }
}

#[tauri::command]
fn write_text_file(file_path: String, contents: String) -> Result<(), String> {
    // Attempt to write the file
    let parsed_path = file_path.replace("%user%", &whoami::username());

    match fs::write(&parsed_path, contents) {
        // If successful, return nothing
        Ok(_) => Ok(()),
        // If an error occurs, return the error
        Err(error) => Err(format!(
            "Error writing file: {} for path: {}",
            error, file_path
        )),
    }
}

#[tauri::command]
fn remove_dir(path: String) -> Result<(), String> {
    // Attempt to remove the directory
    let parsed_path = path.replace("%user%", &whoami::username());
    
    match fs::remove_dir_all(&parsed_path) {
        // If successful, return nothing
        Ok(_) => Ok(()),
        // If an error occurs, return the error
        Err(error) => Err(format!(
            "Error removing directory: {} for path: {}",
            error, path
        )),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_upload::init())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            read_file,
            extract_zip,
            write_text_file,
            remove_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
