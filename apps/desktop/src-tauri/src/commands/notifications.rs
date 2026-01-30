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
