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
#[tauri::command]
pub async fn set_badge_count(app: tauri::AppHandle, count: u32) -> Result<(), String> {
    #[cfg(target_os = "ios")]
    {
        app.notification()
            .set_badge_count(Some(count as i32))
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "ios"))]
    {
        let _ = (app, count);
    }
    
    Ok(())
}
