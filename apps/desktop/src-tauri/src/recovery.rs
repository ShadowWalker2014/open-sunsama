//! Ways out that don't depend on the web app. If the webview crashes, its
//! in-app update banner and settings are gone too, so the app menu and tray
//! call these instead.

use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_updater::UpdaterExt;

/// Clears the persisted query cache (keeps the session) and reloads.
const RESET_LOCAL_DATA_JS: &str = r#"(() => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("open_sunsama_rq_cache"))
      .forEach((key) => localStorage.removeItem(key));
    // Cleared again on start, in case a pending write lands first.
    sessionStorage.setItem("open_sunsama_pending_cache_reset", "1");
  } catch (e) {}
  window.location.reload();
})();"#;

pub fn reset_local_data(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.eval(RESET_LOCAL_DATA_JS);
    }
}

/// Checks the update endpoint natively; installs and restarts if there is one.
pub fn check_for_updates(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let notify = |title: &str, body: &str| {
            let _ = app.notification().builder().title(title).body(body).show();
        };

        let update = match app.updater() {
            Ok(updater) => updater.check().await,
            Err(error) => Err(error),
        };

        match update {
            Ok(Some(update)) => {
                notify(
                    "Updating Open Sunsama",
                    &format!("Installing version {}. The app restarts when it's done.", update.version),
                );
                match update.download_and_install(|_, _| {}, || {}).await {
                    Ok(()) => app.restart(),
                    Err(error) => notify("Update failed", &error.to_string()),
                }
            }
            Ok(None) => notify("Open Sunsama is up to date", "You have the latest version."),
            Err(error) => notify("Couldn't check for updates", &error.to_string()),
        }
    });
}
