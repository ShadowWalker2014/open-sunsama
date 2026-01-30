# Open Sunsama Mobile App

Tauri v2 mobile app that wraps the web app for iOS and Android. This provides 100% feature parity with the web app while adding native mobile capabilities like haptic feedback, push notifications, and biometric authentication.

## Prerequisites

### General Requirements

```bash
# Rust (via rustup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Tauri CLI
cargo install tauri-cli
```

### iOS Development (macOS only)

1. **Install Xcode** from the App Store

2. **Set Xcode as active developer directory:**
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

3. **Accept Xcode license:**
   ```bash
   sudo xcodebuild -license accept
   ```

4. **Add iOS Rust targets:**
   ```bash
   rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
   ```

5. **Configure Apple Developer Team:**
   - Open Xcode → Settings → Accounts
   - Sign in with your Apple ID
   - Click "Manage Certificates" → Create "Apple Development" certificate
   - Note your Team ID (10-character alphanumeric code)
   - Update `src-tauri/tauri.conf.json`:
     ```json
     "iOS": {
       "developmentTeam": "YOUR_TEAM_ID"
     }
     ```

6. **Initialize iOS project (first time only):**
   ```bash
   bun run tauri ios init
   ```

### Android Development

1. **Install Android Studio** from https://developer.android.com/studio

2. **Set environment variables** (add to `~/.zshrc` or `~/.bashrc`):
   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk | sort -V | tail -n 1)"
   export PATH="$ANDROID_HOME/platform-tools:$PATH"
   ```

3. **Add Android Rust targets:**
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
   ```

4. **Initialize Android project (first time only):**
   ```bash
   bun run tauri android init
   ```

## Development

### iOS Simulator

```bash
# Start development (runs web server + builds + launches simulator)
bun run dev:ios

# Or specify a device
bun run tauri ios dev "iPhone 15 Pro"
```

### Android Emulator

```bash
# Start development
bun run dev:android

# Or specify a device
bun run tauri android dev "Pixel_7_API_34"
```

### Manual Build & Run

If the Tauri CLI hangs, you can build manually:

1. **Start the web dev server:**
   ```bash
   cd ../web && bun run dev
   ```

2. **Open Xcode project:**
   ```bash
   open src-tauri/gen/apple/open-sunsama-mobile.xcodeproj
   ```

3. **Select your simulator** from the device dropdown and click **Play (▶)**

## Building for Release

### iOS

```bash
bun run build:ios
```

Output: `src-tauri/gen/apple/build/` (.ipa file)

**Note:** For App Store distribution, configure signing in Xcode and use `tauri ios build --release`.

### Android

```bash
bun run build:android
```

Output: `src-tauri/gen/android/app/build/outputs/` (.apk or .aab)

## Project Structure

```
apps/mobile/
├── src/                          # TypeScript mobile helpers
│   ├── index.ts                  # Mobile API exports
│   └── types.ts                  # TypeScript types
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # App entry point
│   │   ├── main.rs               # Main function
│   │   └── commands/             # Tauri commands
│   │       ├── haptics.rs        # Haptic feedback
│   │       └── notifications.rs  # Push notifications
│   ├── capabilities/
│   │   └── default.json          # Plugin permissions
│   ├── icons/                    # App icons (iOS & Android)
│   ├── gen/                      # Generated platform code (gitignored)
│   │   ├── apple/                # Xcode project
│   │   └── android/              # Android project
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── package.json
└── tsconfig.json
```

## Configuration

### `tauri.conf.json`

Key settings:

```json
{
  "build": {
    "devUrl": "http://localhost:3000",      // Dev server URL
    "frontendDist": "../../web/dist"        // Production build path
  },
  "bundle": {
    "iOS": {
      "developmentTeam": "YOUR_TEAM_ID",    // Apple Team ID
      "minimumSystemVersion": "14.0"
    },
    "android": {
      "minSdkVersion": 24                   // Android 7.0+
    }
  }
}
```

### Mobile-Specific Features

The app includes these native capabilities via Tauri plugins:

| Feature | Plugin | Usage |
|---------|--------|-------|
| Haptic Feedback | `tauri-plugin-haptics` | `triggerHaptic('light')` |
| Push Notifications | `tauri-plugin-notification` | `requestNotificationPermission()` |
| Secure Storage | `tauri-plugin-store` | Persistent key-value storage |
| Deep Links | `tauri-plugin-deep-link` | `opensunsama://task/{id}` |
| Biometric Auth | `tauri-plugin-biometric` | Face ID / Touch ID / Fingerprint |

## Troubleshooting

### iOS Build Fails with "PhaseScriptExecution"

The Xcode build script needs access to `bun` and `cargo`. The project is configured to add these to PATH, but if it fails:

1. Open Xcode project
2. Select target → Build Phases → "Build Rust Code"
3. Verify the script starts with:
   ```bash
   export PATH="$HOME/.bun/bin:$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
   ```

### White/Blank Screen on Simulator

1. **Check web server is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **For iOS simulator**, localhost should work. If not, use your local IP:
   - Find IP: `ipconfig getifaddr en0`
   - Update `tauri.conf.json`: `"devUrl": "http://YOUR_IP:3000"`
   - Update `apps/web/vite.config.ts`: ensure `host: true` is set

3. **Rebuild the app** after config changes

### "Blocking waiting for file lock on iOS"

A previous build is stuck. Kill it:
```bash
pkill -f "tauri\|xcodebuild\|cargo"
rm -rf src-tauri/target/aarch64-apple-ios-sim/debug/incremental
```

### Missing Team ID

Get your Apple Team ID:
1. Open Xcode → Settings → Accounts
2. Select your Apple ID
3. Team ID is shown next to your team name (10-character code like `DQVMM49PG9`)

## Updating App Icons

Generate new icons from a 1024x1024 source image:

```bash
bun run tauri icon path/to/icon.png
```

This generates all required sizes for iOS and Android.
