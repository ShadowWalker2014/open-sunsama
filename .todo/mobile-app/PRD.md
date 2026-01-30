# Mobile Apps for Open Sunsama (iOS & Android)

## Problem
Users need to access their tasks and time blocks on mobile devices (iPhone and Android). The current web app is responsive but lacks native mobile features like push notifications, offline support, biometric authentication, and home screen widgets. A native mobile experience is essential for a productivity app that users rely on throughout the day.

## Solution
Build mobile apps using **React Native with Expo** (managed workflow) to maximize code reuse with the existing React web app while providing true native mobile capabilities.

### Why React Native + Expo over Alternatives

| Approach | Code Reuse | Native Features | Maintenance | Decision |
|----------|------------|-----------------|-------------|----------|
| **React Native + Expo** | High (~70% logic) | Full native access | Single JS codebase | **Recommended** |
| Capacitor (WebView) | ~95% | Limited | Easy but degraded UX | Rejected |
| Flutter | 0% (rewrite) | Full native | Separate Dart codebase | Rejected |

**Key reasons for Expo:**
1. **Shares React paradigm** - Hooks, components, state management patterns transfer directly
2. **Shares `@open-sunsama/api-client`** - Same API client, types, and React Query hooks
3. **Shares `@open-sunsama/types`** - TypeScript types work across platforms
4. **Better UX than WebView** - Native navigation, gestures, performance
5. **Single codebase** - One React Native app for iOS + Android
6. **Expo ecosystem** - Push notifications, secure storage, biometrics built-in
7. **EAS Build** - Cloud builds without local Xcode/Android Studio setup

## Technical Implementation

### Architecture Overview

```
apps/mobile/                      # Expo React Native app
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Landing/redirect
│   ├── (auth)/                  # Auth routes (login, register)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/                   # Authenticated routes
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Kanban/task list
│       ├── calendar.tsx         # Calendar view
│       └── settings.tsx         # Settings
├── src/
│   ├── components/              # Mobile-specific components
│   │   ├── task-card.tsx       # Native task card
│   │   ├── task-list.tsx       # FlatList-based task list
│   │   ├── day-column.tsx      # Day column for horizontal scroll
│   │   ├── calendar-view.tsx   # Calendar with time blocks
│   │   └── ui/                 # Base UI components (native)
│   ├── hooks/                   # Mobile-specific hooks
│   │   ├── usePushNotifications.ts
│   │   ├── useBiometrics.ts
│   │   └── useOfflineSync.ts
│   ├── lib/                     # Utilities
│   │   ├── api.ts              # API client setup (same as web)
│   │   ├── storage.ts          # Secure storage wrapper
│   │   └── platform.ts         # Platform detection
│   └── providers/               # Context providers
│       ├── auth-provider.tsx
│       └── offline-provider.tsx
├── assets/                       # Images, fonts
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── package.json
└── tsconfig.json
```

### Components

1. **Root Layout** (`apps/mobile/app/_layout.tsx`)
   - Sets up QueryClientProvider, AuthProvider, OfflineProvider
   - Configures navigation theme and safe areas
   - Handles deep linking for `opensunsama://` URLs

2. **Task List Screen** (`apps/mobile/app/(app)/index.tsx`)
   - Horizontal ScrollView with day columns (like web kanban)
   - Each column is a FlatList of TaskCard components
   - Pull-to-refresh triggers query invalidation
   - FAB for quick task creation

3. **TaskCard Component** (`apps/mobile/src/components/task-card.tsx`)
   - Pressable card with swipe actions (complete, reschedule, delete)
   - Uses react-native-gesture-handler for smooth swipes
   - Reuses same data shape as web `Task` type

4. **Calendar View** (`apps/mobile/app/(app)/calendar.tsx`)
   - Vertical timeline with time blocks
   - Drag to create/resize time blocks (react-native-gesture-handler)
   - Uses same `TimeBlock` types and API hooks

5. **API Integration** (`apps/mobile/src/lib/api.ts`)
   - Imports `@open-sunsama/api-client` directly
   - Configures with AsyncStorage token retrieval
   - Same React Query hooks pattern as web

6. **Push Notifications** (`apps/mobile/src/hooks/usePushNotifications.ts`)
   - Uses `expo-notifications` for cross-platform push
   - Registers device token with backend
   - Handles notification received/tapped events

7. **Biometric Auth** (`apps/mobile/src/hooks/useBiometrics.ts`)
   - Uses `expo-local-authentication`
   - Prompts for Face ID / fingerprint on app open
   - Stores session encrypted in SecureStore

8. **Offline Support** (`apps/mobile/src/providers/offline-provider.tsx`)
   - Uses `@tanstack/react-query` persistor with AsyncStorage
   - Queues mutations when offline
   - Syncs on reconnect with conflict resolution

### Code Sharing Strategy

```
packages/                         # Shared packages (existing)
├── api-client/                   # Works in both web and mobile
├── types/                        # TypeScript types (shared)
└── utils/                        # Utility functions (shared)

apps/web/src/                     # Web-specific
├── components/                   # React DOM components
├── hooks/                        # Web-specific hooks
└── lib/                          # Web utilities

apps/mobile/src/                  # Mobile-specific
├── components/                   # React Native components
├── hooks/                        # Mobile-specific hooks
└── lib/                          # Mobile utilities
```

**What's Shared (70% of logic):**
- `@open-sunsama/api-client` - API calls, React Query hooks
- `@open-sunsama/types` - All TypeScript interfaces
- Business logic in hooks (task filtering, date calculations)
- Authentication flow logic
- React Query key patterns

**What's Mobile-Specific (30%):**
- UI components (React Native vs React DOM)
- Navigation (Expo Router vs TanStack Router)
- Storage (AsyncStorage vs localStorage)
- Notifications (expo-notifications vs web notifications)
- Gestures (react-native-gesture-handler)

### Flow

1. **App Launch** → Check SecureStore for token → Biometric prompt (if enabled) → Load cached data → Sync with server
2. **Task Creation** → Optimistic update → API call → Background sync → Push confirmation
3. **Offline Mode** → Queue mutations → Show pending indicator → Sync on reconnect
4. **Push Notification** → Tap notification → Deep link to task → Open task detail sheet

### Folder Structure (Full)

```
apps/mobile/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root: providers, theme
│   ├── index.tsx                # Redirect to /login or /(app)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Stack navigator
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (app)/
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Kanban board
│       ├── calendar.tsx         # Calendar view
│       ├── settings/
│       │   ├── index.tsx        # Settings list
│       │   ├── profile.tsx
│       │   ├── notifications.tsx
│       │   └── api-keys.tsx
│       └── task/
│           └── [id].tsx         # Task detail (modal)
├── src/
│   ├── components/
│   │   ├── kanban/
│   │   │   ├── kanban-board.tsx
│   │   │   ├── day-column.tsx
│   │   │   └── task-card.tsx
│   │   ├── calendar/
│   │   │   ├── calendar-view.tsx
│   │   │   ├── time-block.tsx
│   │   │   └── timeline.tsx
│   │   ├── task/
│   │   │   ├── task-detail-sheet.tsx
│   │   │   ├── task-form.tsx
│   │   │   └── subtask-list.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── sheet.tsx        # Bottom sheet
│   │       └── toast.tsx
│   ├── hooks/
│   │   ├── useTasks.ts          # Wraps api-client hooks
│   │   ├── useTimeBlocks.ts
│   │   ├── useAuth.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useBiometrics.ts
│   │   ├── useOfflineSync.ts
│   │   └── useHaptics.ts
│   ├── lib/
│   │   ├── api.ts               # API client setup
│   │   ├── storage.ts           # AsyncStorage + SecureStore
│   │   ├── query-client.ts      # React Query with persistor
│   │   └── constants.ts
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   ├── offline-provider.tsx
│   │   └── theme-provider.tsx
│   └── styles/
│       ├── colors.ts
│       └── typography.ts
├── assets/
│   ├── icon.png                 # App icon (1024x1024)
│   ├── splash.png               # Splash screen
│   ├── adaptive-icon.png        # Android adaptive icon
│   └── favicon.png              # Web (if using Expo web)
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── babel.config.js
├── metro.config.js              # Include workspace packages
├── package.json
└── tsconfig.json
```

### Dependencies

**package.json:**
```json
{
  "name": "@open-sunsama/mobile",
  "version": "0.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@open-sunsama/api-client": "workspace:*",
    "@open-sunsama/types": "workspace:*",
    "@open-sunsama/utils": "workspace:*",
    "@tanstack/react-query": "^5.62.7",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-local-authentication": "~15.0.0",
    "expo-haptics": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.0.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.12",
    "typescript": "~5.7.2"
  }
}
```

**metro.config.js** (for monorepo):
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

**app.json:**
```json
{
  "expo": {
    "name": "Open Sunsama",
    "slug": "open-sunsama",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "opensunsama",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.opensunsama.mobile",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID to unlock Open Sunsama"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "app.opensunsama.mobile"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow Open Sunsama to use Face ID"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**eas.json:**
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Turborepo Integration

**turbo.json** additions:
```json
{
  "tasks": {
    "@open-sunsama/mobile#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@open-sunsama/mobile#build": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "@open-sunsama/mobile#typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json"]
    }
  }
}
```

### API & CORS Configuration

The production API at `https://api.sunsama.com` needs CORS updates:

```javascript
// apps/api/src/index.ts - update CORS
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'tauri://localhost',
    'https://tauri.localhost',
    // Mobile app origins (Expo development)
    'exp://192.168.1.*:8081',
    'exp://localhost:8081',
    // Production mobile (no origin header needed - native apps)
  ],
  // ... rest unchanged
}));
```

Note: Native mobile apps don't send Origin headers, so CORS isn't an issue in production. The API should accept requests with valid Authorization headers regardless of origin.

## Features (Prioritized)

### Phase 1: MVP (Week 1-2)
1. **Authentication** - Login, register, secure token storage
2. **Task List View** - View tasks by day, mark complete
3. **Task Creation** - Quick add task with title and date
4. **Pull-to-Refresh** - Refresh task list

### Phase 2: Core Features (Week 3-4)
5. **Task Detail Sheet** - Edit task title, description, priority
6. **Calendar View** - View time blocks for today
7. **Date Navigation** - Swipe between days
8. **Push Notifications** - Task reminders

### Phase 3: Native Experience (Week 5-6)
9. **Offline Support** - View cached tasks, queue mutations
10. **Biometric Auth** - Face ID / fingerprint lock
11. **Haptic Feedback** - Tactile response on actions
12. **Dark Mode** - System theme support

### Phase 4: Advanced (Future)
13. **Drag & Drop** - Reorder tasks (gesture-based)
14. **Time Block Creation** - Add/edit time blocks
15. **Subtasks** - Manage task subtasks
16. **Widgets** - iOS/Android home screen widgets (expo-widgets)

## Build & Release Process

### Development
```bash
# Start Expo dev server
cd apps/mobile
bun run dev

# Run on iOS Simulator
bun run ios

# Run on Android Emulator
bun run android
```

### Testing on Device
```bash
# Build development client for internal testing
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Release
```bash
# Build for App Store / Play Store
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/mobile.yml
name: Mobile Build
on:
  push:
    tags: ['mobile-v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && eas build --platform all --non-interactive
```

## Edge Cases

- **No network on launch**: Show cached data with offline indicator
- **Token expired while offline**: Queue re-auth, prompt login on reconnect
- **Large task list**: Virtualize with FlatList, paginate API calls
- **Background notification**: Wake app, sync data, update badge
- **Deep link when logged out**: Store destination, redirect after login
- **Biometric fails repeatedly**: Fall back to password entry
- **Push permission denied**: Show in-app setting to re-prompt
- **App killed during sync**: Resume on next launch with queued mutations
- **Timezone changes**: Re-calculate scheduled dates on app foreground

## Implementation Steps

1. **Initialize Expo project**
   - Run `npx create-expo-app@latest apps/mobile --template blank-typescript`
   - Configure metro.config.js for monorepo
   - Add to workspace in root package.json
   - Install expo-router and configure

2. **Set up shared package imports**
   - Configure metro to resolve workspace packages
   - Verify `@open-sunsama/api-client` imports work
   - Set up API client with AsyncStorage token

3. **Build authentication flow**
   - Create login/register screens
   - Implement SecureStore token persistence
   - Set up AuthProvider with useAuth hook

4. **Create task list UI**
   - Build TaskCard component (native)
   - Create horizontal day column scroll
   - Implement useTasks hook (wraps api-client)
   - Add pull-to-refresh

5. **Add task creation**
   - Build quick-add modal/sheet
   - Wire up useCreateTask mutation
   - Optimistic updates for instant feedback

6. **Implement calendar view**
   - Port calendar timeline to React Native
   - Time block display (view-only first)
   - Navigation between days

7. **Add push notifications**
   - Set up expo-notifications
   - Create backend endpoint for device tokens
   - Handle notification tap → deep link

8. **Implement offline support**
   - Configure react-query persistor
   - Queue mutations with expo-secure-store
   - Sync on reconnect

9. **Add biometric authentication**
   - Implement expo-local-authentication
   - Add setting toggle in app
   - Prompt on app launch

10. **Polish and release**
    - App icons and splash screen
    - Test on physical devices
    - EAS Build and Submit to stores
