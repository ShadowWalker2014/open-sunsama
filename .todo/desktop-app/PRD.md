# Desktop App for Open Sunsama

## Problem
Users need a native desktop experience for Open Sunsama with system tray access, global hotkeys, and native notifications. The current web app works well but lacks desktop-specific conveniences that productivity apps benefit from.

## Solution
Build a desktop app using **Tauri v2** that wraps the existing React web app with minimal modifications. Tauri is chosen over Electron for:
- **Smaller binary size** (~10MB vs ~150MB+ for Electron)
- **Better performance** (native WebView, lower memory footprint)
- **Security** (Rust backend, no Node.js in production)
- **Modern architecture** (built-in auto-updater, cross-platform consistency)
- **Existing Vite integration** (the web app already uses Vite)

The desktop app will load the web app's built assets directly, ensuring 100% code reuse for UI.

## Technical Implementation

### Architecture Overview
```
apps/desktop/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── main.rs      # App entry, window management
│   │   ├── tray.rs      # System tray implementation
│   │   ├── hotkeys.rs   # Global keyboard shortcuts
│   │   ├── menu.rs      # Native menu bar
│   │   └── lib.rs       # Module exports
│   ├── icons/           # App icons (macOS, Windows, Linux)
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── src/                 # Desktop-specific TypeScript
│   ├── preload.ts       # Bridge between Tauri and React
│   └── desktop-api.ts   # TypeScript bindings for Tauri commands
├── package.json
└── vite.config.ts       # Extends web vite config
```

### Components

1. **Tauri Shell** (`apps/desktop/src-tauri/src/main.rs`)
   - Creates main window loading web app assets
   - Initializes system tray, menu, and global shortcuts
   - Handles app lifecycle (startup, close-to-tray, wake)

2. **System Tray** (`apps/desktop/src-tauri/src/tray.rs`)
   - Shows app icon in system tray
   - Quick actions menu: "Add Task", "Show Today", "Focus Mode"
   - Shows/hides main window on click
   - Displays notification badges (optional)

3. **Global Hotkeys** (`apps/desktop/src-tauri/src/hotkeys.rs`)
   - `Cmd/Ctrl+Shift+T` - Quick add task (opens mini dialog)
   - `Cmd/Ctrl+Shift+O` - Show/hide app window
   - `Cmd/Ctrl+Shift+F` - Start focus mode on current task
   - Configurable in settings (stored in `tauri-plugin-store`)

4. **Native Menu** (`apps/desktop/src-tauri/src/menu.rs`)
   - Standard app menu (File, Edit, View, Window, Help)
   - macOS-specific menu items (About, Preferences)
   - View menu: Toggle sidebar, Switch to Calendar/Kanban

5. **Desktop Bridge** (`apps/desktop/src/desktop-api.ts`)
   - TypeScript wrapper for Tauri commands using `@tauri-apps/api`
   - Exposes: `showNotification()`, `setAutoLaunch()`, `getBadgeCount()`
   - Platform detection: `isDesktop()` helper for web app

6. **Web App Integration** (`apps/web/src/lib/desktop.ts`)
   - Conditional import of desktop features
   - Falls back gracefully when running in browser
   - Exports unified API for notifications, shortcuts, etc.

### Code Sharing Strategy

```
apps/web/                    # React app (unchanged)
  └── dist/                  # Built assets

apps/desktop/
  └── src-tauri/
      └── tauri.conf.json    # Points to ../web/dist as frontendDist
```

**Key principle**: The desktop app builds and serves the web app's production bundle. No UI code duplication.

**Desktop-aware hooks** (added to `apps/web/src/hooks/`):
- `useDesktopNotifications.ts` - Sends native notifications via Tauri
- `useGlobalShortcuts.ts` - Registers/handles shortcuts from React
- These use dynamic imports and feature detection

### Flow

1. **Build**: `turbo run build` builds web first, then desktop (dependency)
2. **Package**: Tauri bundles web dist + Rust binary into `.dmg`/`.exe`/`.AppImage`
3. **Runtime**: Tauri loads `dist/index.html` in native WebView
4. **IPC**: React calls Tauri commands via `invoke()`, Tauri emits events back

### Folder Structure

```
apps/desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── tray.rs
│   │   ├── hotkeys.rs
│   │   ├── menu.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── notifications.rs
│   │   │   └── settings.rs
│   │   └── state.rs
│   ├── icons/
│   │   ├── icon.icns         # macOS
│   │   ├── icon.ico          # Windows
│   │   ├── icon.png          # Linux
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   └── 128x128@2x.png
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── src/
│   ├── index.ts              # Desktop API exports
│   ├── notifications.ts      # Native notification helpers
│   ├── shortcuts.ts          # Shortcut registration
│   ├── autolaunch.ts         # Auto-start on login
│   └── types.ts              # TypeScript types for IPC
├── package.json
├── tsconfig.json
└── README.md
```

### Build & Release

**Development**:
```bash
# Terminal 1: Start web dev server
bun run --filter=@open-sunsama/web dev

# Terminal 2: Start Tauri dev (uses web dev server)
bun run --filter=@open-sunsama/desktop dev
```

**Production Build**:
```bash
# Build everything
bun run build

# Or just desktop (builds web as dependency)
bun run --filter=@open-sunsama/desktop build
```

**CI/CD** (GitHub Actions):
- On tag push (`v*`), build for macOS, Windows, Linux
- Sign macOS builds with Developer ID
- Sign Windows builds with code signing cert
- Upload artifacts to GitHub Releases
- Auto-update manifest pushed to releases

### Dependencies

**Rust (Cargo.toml)**:
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "devtools"] }
tauri-plugin-shell = "2"
tauri-plugin-store = "2"           # Persistent settings
tauri-plugin-autostart = "2"       # Launch on startup
tauri-plugin-global-shortcut = "2" # Hotkeys
tauri-plugin-notification = "2"    # Native notifications
tauri-plugin-updater = "2"         # Auto-updates
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**TypeScript (package.json)**:
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-autostart": "^2",
    "@tauri-apps/plugin-global-shortcut": "^2",
    "@tauri-apps/plugin-notification": "^2",
    "@tauri-apps/plugin-store": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2"
  }
}
```

### Configuration

**tauri.conf.json** (key sections):
```json
{
  "productName": "Open Sunsama",
  "identifier": "app.opensunsama.desktop",
  "build": {
    "frontendDist": "../web/dist"
  },
  "app": {
    "windows": [{
      "title": "Open Sunsama",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "decorations": true,
      "transparent": false
    }],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"],
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

**turbo.json** addition:
```json
{
  "tasks": {
    "desktop:dev": {
      "dependsOn": ["@open-sunsama/web#dev"],
      "cache": false,
      "persistent": true
    },
    "desktop:build": {
      "dependsOn": ["@open-sunsama/web#build"],
      "outputs": ["src-tauri/target/release/bundle/**"]
    }
  }
}
```

## Edge Cases

- **Offline mode**: App should show cached data; API calls queue for retry
- **Close vs quit**: Clicking X minimizes to tray on macOS/Windows; `Cmd+Q` actually quits
- **Multi-window**: Prevent multiple instances; focus existing window instead
- **Deep links**: Handle `opensunsama://` URLs for OAuth callbacks
- **Auto-update failures**: Graceful fallback to manual download link
- **Permission denied**: Handle macOS notification/accessibility permission prompts
- **Web fallback**: If Tauri APIs unavailable, gracefully degrade to web behavior

## Implementation Steps

1. **Initialize Tauri project**
   - Create `apps/desktop` with `bun create tauri-app`
   - Configure to use `../web/dist` as frontend
   - Add to workspace in root `package.json`

2. **Basic window setup**
   - Configure window size, title, icon in `tauri.conf.json`
   - Test loading web app in desktop shell
   - Add turbo tasks for dev/build

3. **System tray**
   - Implement tray icon and menu in Rust
   - Add show/hide window toggle
   - Quick actions: Add Task, Open Calendar

4. **Global shortcuts**
   - Register configurable hotkeys
   - Implement quick-add task overlay
   - Show/hide app shortcut

5. **Native notifications**
   - Replace web notifications with native
   - Add TypeScript bridge in web app
   - Handle notification clicks (deep link to task)

6. **Menu bar**
   - Build native menu for macOS/Windows
   - Wire up view toggles, preferences
   - Add About dialog

7. **Auto-launch & settings**
   - Implement auto-start on login
   - Persist settings with tauri-plugin-store
   - Settings UI in web app (uses desktop API)

8. **Build & release pipeline**
   - GitHub Actions workflow for CI
   - Code signing for macOS/Windows
   - Auto-updater configuration

9. **Desktop hooks for web app**
   - Create `useDesktop()` hook for feature detection
   - Add `useNativeNotification()` hook
   - Conditional rendering for desktop-only UI
