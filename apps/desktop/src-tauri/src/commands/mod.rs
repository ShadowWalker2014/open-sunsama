mod notifications;
mod settings;

pub use notifications::*;
pub use settings::*;

/// Check if running in desktop environment
#[tauri::command]
pub fn is_desktop() -> bool {
    true
}
