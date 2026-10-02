use serde::{Deserialize, Serialize};
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationOptions {
    pub title: String,
    pub body: Option<String>,
    #[serde(rename = "actionTypeId")]
    pub action_type_id: Option<String>,
}

/// Show a native notification
#[tauri::command]
pub fn show_notification(
    app: tauri::AppHandle,
    options: NotificationOptions,
) -> Result<(), String> {
    let mut notification = app.notification().builder();
    
    notification = notification.title(&options.title);
    
    if let Some(body) = &options.body {
        notification = notification.body(body);
    }

    notification
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))
}

/// Request native notification permission.
#[tauri::command]
pub fn request_notification_permission(app: tauri::AppHandle) -> Result<bool, String> {
    let permission = app
        .notification()
        .request_permission()
        .map_err(|e| format!("Failed to request notification permission: {}", e))?;

    Ok(permission == tauri_plugin_notification::PermissionState::Granted)
}

/// Read native notification permission without touching browser APIs.
#[tauri::command]
pub fn get_notification_permission(app: tauri::AppHandle) -> Result<String, String> {
    app.notification()
        .permission_state()
        .map(|permission| permission.to_string())
        .map_err(|e| format!("Failed to read notification permission: {}", e))
}
