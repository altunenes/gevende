// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod butterworth;
use crate::butterworth::apply_butterworth_filter;  // Import the function from the butterworth module
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            apply_butterworth_filter 
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}