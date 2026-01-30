use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HapticType {
    Light,
    Medium,
    Heavy,
    Selection,
    Success,
    Warning,
    Error,
}

/// Trigger haptic feedback
#[tauri::command]
pub async fn trigger_haptic(
    app: tauri::AppHandle,
    haptic_type: HapticType,
) -> Result<(), String> {
    use tauri_plugin_haptics::HapticsExt;
    
    let haptics = app.haptics();
    
    match haptic_type {
        HapticType::Light => haptics.impact(tauri_plugin_haptics::ImpactFeedbackStyle::Light),
        HapticType::Medium => haptics.impact(tauri_plugin_haptics::ImpactFeedbackStyle::Medium),
        HapticType::Heavy => haptics.impact(tauri_plugin_haptics::ImpactFeedbackStyle::Heavy),
        HapticType::Selection => haptics.selection(),
        HapticType::Success => haptics.notification(tauri_plugin_haptics::NotificationFeedbackType::Success),
        HapticType::Warning => haptics.notification(tauri_plugin_haptics::NotificationFeedbackType::Warning),
        HapticType::Error => haptics.notification(tauri_plugin_haptics::NotificationFeedbackType::Error),
    }.map_err(|e| e.to_string())
}
