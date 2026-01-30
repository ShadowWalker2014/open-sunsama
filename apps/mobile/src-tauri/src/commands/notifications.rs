use tauri_plugin_notification::NotificationExt;

/// Request notification permission from the user
#[tauri::command]
pub async fn request_notification_permission(app: tauri::AppHandle) -> Result<bool, String> {
    let permission = app.notification()
        .request_permission()
        .map_err(|e| e.to_string())?;
    
    Ok(permission == tauri_plugin_notification::PermissionState::Granted)
}

/// Set the app badge count (iOS only, no-op on Android)
/// Note: Badge count is typically set via push notification payload
#[tauri::command]
pub async fn set_badge_count(_app: tauri::AppHandle, _count: u32) -> Result<(), String> {
    // Badge count setting is handled via push notification payload on iOS
    // This is a no-op as direct badge manipulation requires UIApplication access
    Ok(())
}
