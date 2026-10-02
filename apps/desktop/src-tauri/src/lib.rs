mod commands;
mod menu;
mod recovery;
mod tray;

use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn run() {
    let mut builder = tauri::Builder::default();

    // Register plugins
    builder = builder
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        handle_global_shortcut(app, shortcut);
                    }
                })
                .build(),
        );

    builder
        .setup(|app| {
            // Set up system tray
            tray::create_tray(app)?;

            // Set up menu
            menu::create_menu(app)?;

            // Register global shortcuts. Another app may already own a key
            // combination; that must not stop the app from starting.
            register_global_shortcuts(app);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::show_notification,
            commands::get_auto_launch,
            commands::set_auto_launch,
            commands::get_settings,
            commands::set_settings,
            commands::is_desktop,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| match event {
            // An updater restart launches the executable directly. macOS can
            // leave that process behind other apps unless we activate it once
            // the event loop and main window are ready.
            tauri::RunEvent::Ready => {
                if !launched_minimized() {
                    show_main_window(app);
                }
            }
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => show_main_window(app),
            _ => {}
        });
}

fn launched_minimized() -> bool {
    std::env::args().any(|argument| argument == "--minimized")
}

fn show_main_window(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    if let Err(error) = app.show() {
        eprintln!("Failed to show application: {error}");
    }
    if let Some(window) = app.get_webview_window("main") {
        bring_to_front(&window);
    }
}

fn register_global_shortcuts(app: &tauri::App) {
    let shortcuts = [
        Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyO),
        Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyT),
        Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyF),
    ];

    for shortcut in shortcuts {
        if let Err(error) = app.global_shortcut().register(shortcut) {
            eprintln!("Failed to register global shortcut {shortcut:?}: {error}");
        }
    }
}

fn handle_global_shortcut(app: &tauri::AppHandle, shortcut: &Shortcut) {
    let toggle_shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyO);
    let new_task_shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyT);
    let focus_shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyF);

    if shortcut == &toggle_shortcut {
        // Toggle window visibility
        if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    } else if shortcut == &new_task_shortcut {
        // Bring the window forward, then let the web app open the add-task input
        if let Some(window) = app.get_webview_window("main") {
            bring_to_front(&window);
            let _ = window.emit("quick-add-task", ());
        }
    } else if shortcut == &focus_shortcut {
        // Bring the window forward, then let the web app open focus mode
        if let Some(window) = app.get_webview_window("main") {
            bring_to_front(&window);
            let _ = window.emit("start-focus-mode", ());
        }
    }
}

fn bring_to_front(window: &tauri::WebviewWindow) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}
