# Tauri v2 Mobile App

## Problem

The current Expo mobile app at `apps/mobile` has limited features compared to the web app. Users expect feature parity across platforms, but maintaining two separate codebases (React web + React Native) creates:
- **Feature lag**: Mobile lacks rich text editing, command palette, attachment uploads, and other web features
- **Code duplication**: UI components must be rebuilt for React Native
- **Inconsistent UX**: Different implementations lead to different behavior

## Solution

Replace the Expo mobile app with a **Tauri v2 mobile app** that wraps the existing React web app. Tauri v2 supports iOS and Android mobile platforms using the same architecture as the desktop app.

**Benefits:**
- **100% feature parity**: Same web app, same features on mobile
- **Zero UI code duplication**: Single React codebase for web, desktop, and mobile
- **Shared Rust backend**: Reuse notification, storage, and native API code from desktop
- **Faster iteration**: Web changes automatically appear on all platforms

**Approach:**
1. Rename `apps/mobile` → `apps/expo-mobile` (keep as backup/fallback)
2. Create new `apps/mobile` with Tauri v2 mobile configuration
3. Share Rust backend code with desktop where applicable
4. Add mobile-specific native features (haptics, push notifications, deep links)

## Technical Implementation

### Architecture Overview

```
apps/mobile/
├── src-tauri/                    # Rust backend (mobile-specific)
│   ├── src/
│   │   ├── main.rs               # App entry
│   │   ├── lib.rs                # Shared module exports
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── haptics.rs        # Haptic feedback
│   │   │   ├── notifications.rs  # Push notifications
│   │   │   └── settings.rs       # App settings
│   │   └── mobile.rs             # Mobile-specific setup
│   ├── gen/                      # Generated platform code
│   │   ├── android/              # Android project
│   │   └── apple/                # iOS/iPadOS project
│   ├── icons/
│   │   ├── ios/                  # iOS app icons (all sizes)
│   │   └── android/              # Android adaptive icons
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # Mobile-specific TypeScript
│   ├── index.ts                  # Mobile API exports
│   ├── haptics.ts                # Haptic feedback helpers
│   ├── notifications.ts          # Push notification helpers
│   ├── deep-links.ts             # Deep link handling
│   └── types.ts                  # TypeScript types
├── package.json
└── tsconfig.json
```

### Components

1. **Tauri Mobile Shell** (`apps/mobile/src-tauri/src/lib.rs`)
   - Initializes mobile app with WebView
   - Loads web app assets from `apps/web/dist`
   - Registers mobile-specific plugins
   - Handles app lifecycle (foreground, background, resume)

2. **Push Notifications** (`apps/mobile/src-tauri/src/commands/notifications.rs`)
   - Firebase Cloud Messaging (Android) / APNs (iOS)
   - Request notification permissions
   - Handle notification tap → deep link to task
   - Badge count management
   - Silent push for background sync

3. **Haptic Feedback** (`apps/mobile/src-tauri/src/commands/haptics.rs`)
   - Light/medium/heavy impact feedback
   - Selection feedback for drag operations
   - Success/warning/error notification haptics
   - Exposed via Tauri commands to web app

4. **Deep Links** (`apps/mobile/src/deep-links.ts`)
   - Handle `opensunsama://` URL scheme
   - OAuth callback handling (same as desktop)
   - Task direct links: `opensunsama://task/{id}`
   - Calendar links: `opensunsama://calendar/{date}`

5. **Mobile Bridge** (`apps/mobile/src/index.ts`)
   - TypeScript wrapper for Tauri mobile commands
   - Exposes: `triggerHaptic()`, `requestNotificationPermission()`, `setBadgeCount()`
   - Platform detection: `isMobile()`, `isIOS()`, `isAndroid()`

6. **Web App Integration** (`apps/web/src/lib/mobile.ts`)
   - Conditional import of mobile features
   - Touch-optimized interactions when running in Tauri mobile
   - Haptic feedback on drag, button press, etc.

### Mobile-Specific Configuration

**tauri.conf.json**:
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Open Sunsama",
  "version": "0.0.0",
  "identifier": "app.opensunsama.mobile",
  "build": {
    "beforeDevCommand": "cd ../web && bun run dev",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "cd ../web && bun run build",
    "frontendDist": "../../web/dist"
  },
  "app": {
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "iOS": {
      "developmentTeam": "TEAM_ID",
      "minimumSystemVersion": "14.0"
    },
    "android": {
      "minSdkVersion": 24
    }
  },
  "plugins": {}
}
```

**Cargo.toml**:
```toml
[package]
name = "open-sunsama-mobile"
version = "0.0.0"
edition = "2021"

[lib]
name = "open_sunsama_mobile_lib"
crate-type = ["lib", "cdylib", "staticlib"]

[build-dependencies]
tauri-build = { version = "2", features = ["mobile"] }

[dependencies]
tauri = { version = "2", features = ["mobile", "devtools"] }
tauri-plugin-shell = "2"
tauri-plugin-store = "2"
tauri-plugin-notification = "2"
tauri-plugin-haptics = "2"
tauri-plugin-deep-link = "2"
tauri-plugin-biometric = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[target.'cfg(target_os = "android")'.dependencies]
tauri = { version = "2", features = ["mobile", "devtools"] }

[target.'cfg(target_os = "ios")'.dependencies]
tauri = { version = "2", features = ["mobile", "devtools"] }
```

**package.json**:
```json
{
  "name": "@open-sunsama/mobile",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:ios": "tauri ios dev",
    "dev:android": "tauri android dev",
    "build:ios": "tauri ios build",
    "build:android": "tauri android build",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf node_modules .turbo src-tauri/target src-tauri/gen",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.2.0",
    "@tauri-apps/plugin-haptics": "^2.2.0",
    "@tauri-apps/plugin-notification": "^2.2.0",
    "@tauri-apps/plugin-store": "^2.2.0",
    "@tauri-apps/plugin-deep-link": "^2.2.0",
    "@tauri-apps/plugin-biometric": "^2.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.2.4",
    "typescript": "^5.7.2"
  }
}
```

### iOS Configuration

**Required Capabilities** (configured in Xcode project at `src-tauri/gen/apple/`):
- Push Notifications
- Background Modes (remote notifications, background fetch)
- Associated Domains (for universal links)

**Info.plist additions**:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>opensunsama</string>
    </array>
  </dict>
</array>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>opensunsama</string>
</array>
```

**App Icons** (`src-tauri/icons/ios/`):
- AppIcon-20x20@1x.png through AppIcon-1024x1024@1x.png
- All required sizes for iOS app store

### Android Configuration

**AndroidManifest.xml additions**:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="opensunsama" />
</intent-filter>
```

**App Icons** (`src-tauri/icons/android/`):
- mipmap-mdpi through mipmap-xxxhdpi
- Adaptive icon with foreground/background layers

### Code Sharing with Desktop

Some Rust code can be shared between desktop and mobile:

```
packages/tauri-shared/          # New shared package (optional)
├── src/
│   ├── lib.rs
│   ├── notifications.rs        # Common notification logic
│   └── settings.rs             # Settings storage
└── Cargo.toml
```

Alternatively, keep platform-specific code separate for simplicity, extracting to shared crate only when substantial duplication emerges.

### Flow

1. **Build**: `bun run build:ios` or `bun run build:android`
   - Builds web app first (dependency)
   - Compiles Rust to native binary
   - Generates platform-specific project
   - Bundles into .ipa (iOS) or .apk/.aab (Android)

2. **Development**:
   - `bun run dev:ios` - Opens iOS simulator with hot reload
   - `bun run dev:android` - Opens Android emulator with hot reload
   - Web app dev server runs alongside

3. **Runtime**:
   - App launches native WebView with web app
   - Tauri commands available via `invoke()`
   - Events bridge native ↔ web

### Monorepo Configuration Updates

**turbo.json** additions:
```json
{
  "tasks": {
    "@open-sunsama/mobile#dev:ios": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@open-sunsama/mobile#dev:android": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@open-sunsama/mobile#build:ios": {
      "dependsOn": ["@open-sunsama/web#build"],
      "outputs": ["src-tauri/gen/apple/build/**"],
      "cache": false
    },
    "@open-sunsama/mobile#build:android": {
      "dependsOn": ["@open-sunsama/web#build"],
      "outputs": ["src-tauri/gen/android/app/build/**"],
      "cache": false
    },
    "@open-sunsama/expo-mobile#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**Root package.json** script updates:
```json
{
  "scripts": {
    "dev:mobile:ios": "turbo run dev:ios --filter=@open-sunsama/mobile --filter=@open-sunsama/api --filter=./packages/*",
    "dev:mobile:android": "turbo run dev:android --filter=@open-sunsama/mobile --filter=@open-sunsama/api --filter=./packages/*",
    "dev:expo": "turbo run dev --filter=@open-sunsama/expo-mobile --filter=@open-sunsama/api --filter=./packages/*",
    "build:mobile:ios": "turbo run build:ios --filter=@open-sunsama/mobile",
    "build:mobile:android": "turbo run build:android --filter=@open-sunsama/mobile"
  }
}
```

### Web App Mobile Detection

**`apps/web/src/lib/mobile.ts`**:
```typescript
import { invoke } from '@tauri-apps/api/core';

export async function isTauriMobile(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('__TAURI__' in window)) return false;
  
  try {
    return await invoke<boolean>('is_mobile');
  } catch {
    return false;
  }
}

export async function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'
): Promise<void> {
  if (await isTauriMobile()) {
    await invoke('trigger_haptic', { type });
  }
}
```

**`apps/web/src/hooks/useMobile.ts`**:
```typescript
import { useEffect, useState } from 'react';
import { isTauriMobile, triggerHaptic } from '@/lib/mobile';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    isTauriMobile().then(setIsMobile);
  }, []);

  return {
    isMobile,
    triggerHaptic,
    // Add more mobile-specific APIs
  };
}
```

## Edge Cases

- **WebView performance**: iOS WKWebView and Android WebView should handle the web app well, but test heavy components (rich text editor, drag-and-drop)
- **Keyboard handling**: Virtual keyboard may cover input fields; ensure proper viewport adjustments in web app
- **Safe area insets**: Handle notches/home indicator on iOS, navigation bar on Android
- **Background app termination**: Handle app being killed in background; restore state on resume
- **Push notification permissions**: Handle denied permissions gracefully; prompt at appropriate time
- **Offline mode**: Same as desktop - queue API calls for retry when online
- **Deep link handling**: Handle cold start vs warm start for incoming deep links
- **OAuth flow**: Use system browser for OAuth, handle callback via deep link
- **File uploads**: Use native file picker via Tauri plugin; handle camera access for photos
- **Biometric auth**: Support Face ID/Touch ID (iOS) and fingerprint (Android) for app lock

## Implementation Steps

1. **Rename existing Expo app**
   - `mv apps/mobile apps/expo-mobile`
   - Update package name to `@open-sunsama/expo-mobile`
   - Update turbo.json references
   - Verify Expo app still works

2. **Initialize Tauri mobile project**
   - Create `apps/mobile` with `tauri init`
   - Initialize iOS: `tauri ios init`
   - Initialize Android: `tauri android init`
   - Configure to use `../web/dist` as frontend

3. **Basic mobile shell**
   - Configure WebView settings in `tauri.conf.json`
   - Test loading web app on iOS simulator
   - Test loading web app on Android emulator
   - Verify touch interactions work correctly

4. **Mobile plugins setup**
   - Add tauri-plugin-haptics
   - Add tauri-plugin-notification
   - Add tauri-plugin-deep-link
   - Add tauri-plugin-biometric
   - Configure permissions in capabilities

5. **Haptic feedback**
   - Implement Rust haptic commands
   - Create TypeScript bridge
   - Add haptics to drag operations in web app
   - Add haptics to button interactions

6. **Push notifications**
   - Configure Firebase (Android) and APNs (iOS)
   - Implement notification registration
   - Handle notification tap → deep link
   - Add badge count management

7. **Deep link handling**
   - Configure URL scheme in both platforms
   - Handle OAuth callbacks
   - Implement task/calendar deep links
   - Test cold start and warm start scenarios

8. **App icons and splash screens**
   - Generate iOS app icons (all sizes)
   - Generate Android adaptive icons
   - Configure splash screens for both platforms

9. **Web app mobile optimizations**
   - Add `useMobile()` hook
   - Ensure touch targets are 44pt minimum
   - Test virtual keyboard behavior
   - Handle safe area insets

10. **Build and release pipeline**
    - Configure iOS provisioning profiles
    - Configure Android signing
    - Set up GitHub Actions for CI
    - Test TestFlight (iOS) and internal testing (Android)

11. **Update monorepo configuration**
    - Update turbo.json with mobile tasks
    - Add npm scripts for mobile dev/build
    - Update AGENTS.md documentation
