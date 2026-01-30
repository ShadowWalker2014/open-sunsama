pub mod haptics;
pub mod notifications;

/// Check if running on mobile platform
#[tauri::command]
pub fn is_mobile() -> bool {
    cfg!(any(target_os = "android", target_os = "ios"))
}

/// Get current platform name
#[tauri::command]
pub fn get_platform() -> String {
    #[cfg(target_os = "android")]
    return "android".to_string();
    
    #[cfg(target_os = "ios")]
    return "ios".to_string();
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    return "unknown".to_string();
}
