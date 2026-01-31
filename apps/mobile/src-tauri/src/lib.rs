mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_biometric::init())
        .invoke_handler(tauri::generate_handler![
            commands::is_mobile,
            commands::get_platform,
            commands::haptics::trigger_haptic,
            commands::notifications::request_notification_permission,
            commands::notifications::set_badge_count,
        ])
        .setup(|_app| {
            // DevTools not available on mobile platforms
            // On desktop, devtools would be opened here in debug mode
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
