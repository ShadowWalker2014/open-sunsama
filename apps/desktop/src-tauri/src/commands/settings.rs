use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AppSettings {
    #[serde(default)]
    pub theme: String,
    #[serde(default)]
    pub auto_launch: bool,
    #[serde(default)]
    pub minimize_to_tray: bool,
    #[serde(default)]
    pub global_shortcuts_enabled: bool,
}

/// Get auto-launch status
#[tauri::command]
pub fn get_auto_launch(app: tauri::AppHandle) -> Result<bool, String> {
    let autostart = app.autolaunch();
    autostart
        .is_enabled()
        .map_err(|e| format!("Failed to get auto-launch status: {}", e))
}

/// Set auto-launch status
#[tauri::command]
pub fn set_auto_launch(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let autostart = app.autolaunch();
    if enabled {
        autostart
            .enable()
            .map_err(|e| format!("Failed to enable auto-launch: {}", e))
    } else {
        autostart
            .disable()
            .map_err(|e| format!("Failed to disable auto-launch: {}", e))
    }
}

/// Get app settings from store
#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let settings: AppSettings = match store.get("settings") {
        Some(value) => serde_json::from_value(value.clone()).unwrap_or_default(),
        None => AppSettings::default(),
    };

    Ok(settings)
}

/// Save app settings to store
#[tauri::command]
pub fn set_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let store = app
        .store("settings.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;

    let value: Value =
        serde_json::to_value(&settings).map_err(|e| format!("Failed to serialize settings: {}", e))?;

    store.set("settings", value);
    store
        .save()
        .map_err(|e| format!("Failed to save settings: {}", e))
}
