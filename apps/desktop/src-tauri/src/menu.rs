use tauri::{
    menu::{Menu, MenuItemBuilder, PredefinedMenuItem, Submenu},
    Manager,
};

pub fn create_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // App menu (macOS only)
    let about = PredefinedMenuItem::about(app, Some("About Open Sunsama"), None)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let hide = PredefinedMenuItem::hide(app, Some("Hide Open Sunsama"))?;
    let hide_others = PredefinedMenuItem::hide_others(app, Some("Hide Others"))?;
    let show_all = PredefinedMenuItem::show_all(app, Some("Show All"))?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("Quit Open Sunsama"))?;

    let app_menu = Submenu::with_items(
        app,
        "Open Sunsama",
        true,
        &[
            &about,
            &separator,
            &settings,
            &separator2,
            &hide,
            &hide_others,
            &show_all,
            &separator3,
            &quit,
        ],
    )?;

    // File menu
    let new_task = MenuItemBuilder::with_id("new_task", "New Task")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let file_sep = PredefinedMenuItem::separator(app)?;
    let close_window = PredefinedMenuItem::close_window(app, Some("Close Window"))?;

    let file_menu = Submenu::with_items(app, "File", true, &[&new_task, &file_sep, &close_window])?;

    // Edit menu
    let undo = PredefinedMenuItem::undo(app, Some("Undo"))?;
    let redo = PredefinedMenuItem::redo(app, Some("Redo"))?;
    let edit_sep = PredefinedMenuItem::separator(app)?;
    let cut = PredefinedMenuItem::cut(app, Some("Cut"))?;
    let copy = PredefinedMenuItem::copy(app, Some("Copy"))?;
    let paste = PredefinedMenuItem::paste(app, Some("Paste"))?;
    let select_all = PredefinedMenuItem::select_all(app, Some("Select All"))?;

    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &undo, &redo, &edit_sep, &cut, &copy, &paste, &edit_sep, &select_all,
        ],
    )?;

    // View menu
    let today_view = MenuItemBuilder::with_id("today_view", "Today")
        .accelerator("CmdOrCtrl+1")
        .build(app)?;
    let calendar_view = MenuItemBuilder::with_id("calendar_view", "Calendar")
        .accelerator("CmdOrCtrl+2")
        .build(app)?;
    let view_sep = PredefinedMenuItem::separator(app)?;
    let reload = MenuItemBuilder::with_id("reload", "Reload")
        .accelerator("CmdOrCtrl+R")
        .build(app)?;
    let view_sep2 = PredefinedMenuItem::separator(app)?;
    let fullscreen = PredefinedMenuItem::fullscreen(app, Some("Enter Full Screen"))?;

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &today_view,
            &calendar_view,
            &view_sep,
            &reload,
            &view_sep2,
            &fullscreen,
        ],
    )?;

    // Window menu
    let minimize = PredefinedMenuItem::minimize(app, Some("Minimize"))?;
    let zoom = PredefinedMenuItem::maximize(app, Some("Zoom"))?;
    let window_sep = PredefinedMenuItem::separator(app)?;
    let bring_all_to_front =
        PredefinedMenuItem::bring_all_to_front(app, Some("Bring All to Front"))?;

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[&minimize, &zoom, &window_sep, &bring_all_to_front],
    )?;

    // Help menu
    let documentation = MenuItemBuilder::with_id("documentation", "Documentation").build(app)?;
    let help_sep = PredefinedMenuItem::separator(app)?;
    let report_issue = MenuItemBuilder::with_id("report_issue", "Report Issue").build(app)?;

    let help_menu =
        Submenu::with_items(app, "Help", true, &[&documentation, &help_sep, &report_issue])?;

    // Build the menu
    let menu = Menu::with_items(
        app,
        &[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    )?;

    app.set_menu(menu)?;

    // Handle menu events
    app.on_menu_event(|app, event| {
        let id = event.id.as_ref();
        match id {
            "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("navigate", "/app/settings");
                }
            }
            "new_task" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("quick-add-task", ());
                }
            }
            "today_view" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("navigate", "/app");
                }
            }
            "calendar_view" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("navigate", "/app/calendar");
                }
            }
            "reload" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.reload()");
                }
            }
            "documentation" => {
                let _ = tauri::async_runtime::spawn(async {
                    let _ = open::that("https://github.com/your-org/open-sunsama");
                });
            }
            "report_issue" => {
                let _ = tauri::async_runtime::spawn(async {
                    let _ = open::that("https://github.com/your-org/open-sunsama/issues");
                });
            }
            _ => {}
        }
    });

    Ok(())
}
