# Auto-Update for Desktop App

## Problem

The Tauri v2 desktop app at `apps/desktop/` has no auto-update mechanism. Users must manually download new versions from the website. This creates friction, slows adoption of fixes, and fragments the user base across stale versions.

## Solution

Implement end-to-end auto-update using Tauri's built-in updater plugin with Ed25519 signature verification. The app checks a custom API endpoint on startup, shows an update banner when a new version is available, downloads and installs in-place, then relaunches — all without leaving the app.

## Technical Implementation

### 1. Generate Signing Keys (one-time setup)

Run locally to generate an Ed25519 keypair:

```bash
bunx tauri signer generate -w ~/.tauri/opensunsama.key
```

- **Public key** → goes into `tauri.conf.json` `plugins.updater.pubkey`
- **Private key** (`~/.tauri/opensunsama.key`) → stored as GitHub secret `TAURI_SIGNING_PRIVATE_KEY`
- **Password** (if set) → stored as GitHub secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### 2. Database Schema (`packages/database/src/schema/releases.ts`)

Add a `signature` column to the existing `releases` table:

```ts
signature: text('signature'), // Ed25519 .sig file content, nullable
```

Update the Zod schemas:
- `insertReleaseSchema` — add `signature: z.string().optional()`
- No migration needed if using `db:push`; otherwise generate a migration with `db:generate`

### 3. API: Tauri Update Endpoint (`apps/api/src/routes/releases.ts`)

Add a **public** (no auth) endpoint that the Tauri updater calls automatically:

```
GET /releases/update/:target/:current_version
```

**Target mapping** — Tauri sends platform identifiers that differ from our DB values:

| Tauri `target`      | DB `platform`  |
|---------------------|----------------|
| `darwin-aarch64`    | `macos-arm64`  |
| `darwin-x86_64`     | `macos-x64`    |
| `linux-x86_64`      | `linux`        |
| `windows-x86_64`    | `windows`      |

**Logic:**
1. Map the Tauri `:target` to our platform name. Return 400 if unknown.
2. Query the latest release for that platform (ordered by `createdAt DESC`).
3. Compare `latest.version` with `:current_version` using semver. If equal or older → return **204 No Content** (Tauri expects 204 for "no update", not 404).
4. If the latest release has no `signature` → return 204 (can't serve an unsigned update).
5. Otherwise return **200** with Tauri's expected JSON shape:

```json
{
  "version": "1.0.7",
  "url": "https://api.opensunsama.com/uploads/releases/v1.0.7/Open-Sunsama_1.0.7_aarch64.dmg",
  "signature": "dW50cnVzdGVk...<base64 Ed25519 sig>",
  "pub_date": "2026-02-05T00:00:00Z",
  "notes": "Bug fixes and performance improvements"
}
```

**Also update `POST /releases`** to accept and persist the optional `signature` field.

### 4. API Validation (`apps/api/src/validation/releases.ts`)

- Add `signature: z.string().optional()` to `createReleaseSchema`
- Add a `tauriTargetParamSchema` for validating the `:target` path param:

```ts
export const TAURI_TARGETS = [
  'darwin-aarch64', 'darwin-x86_64', 'linux-x86_64', 'windows-x86_64'
] as const;

export const updateCheckParamSchema = z.object({
  target: z.enum(TAURI_TARGETS),
  current_version: z.string().regex(/^\d+\.\d+\.\d+/),
});
```

### 5. Tauri Config (`apps/desktop/src-tauri/tauri.conf.json`)

Add `createUpdaterArtifacts` to the `bundle` section and configure the updater plugin:

```jsonc
{
  "bundle": {
    // ...existing config...
    "createUpdaterArtifacts": "v2Compatible"
  },
  "plugins": {
    "updater": {
      "pubkey": "<PUBLIC_KEY_FROM_STEP_1>",
      "endpoints": [
        "https://api.opensunsama.com/releases/update/{{target}}/{{current_version}}"
      ]
    }
  }
}
```

`{{target}}` and `{{current_version}}` are Tauri template variables replaced at runtime.

### 6. Rust Dependencies (`apps/desktop/src-tauri/Cargo.toml`)

Add two new plugins to `[dependencies]`:

```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

`tauri-plugin-process` is required for `relaunch()` after installing an update.

### 7. Rust Plugin Registration (`apps/desktop/src-tauri/src/lib.rs`)

Register both plugins in the builder chain:

```rust
builder = builder
    // ...existing plugins...
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init());
```

### 8. Capabilities (`apps/desktop/src-tauri/capabilities/default.json`)

Add these permissions to the `permissions` array:

```json
"updater:default",
"process:allow-restart"
```

### 9. Frontend: NPM Packages (`apps/web/package.json`)

Add to `dependencies`:

```json
"@tauri-apps/plugin-updater": "^2.0.0",
"@tauri-apps/plugin-process": "^2.0.0"
```

### 10. Frontend: Update Checker (`apps/web/src/`)

Create update-related files following the existing desktop integration pattern in `lib/desktop.ts` and `hooks/useDesktop.ts`:

**`apps/web/src/lib/updater.ts`** — Low-level updater functions:
- `checkForUpdate()` — calls `check()` from `@tauri-apps/plugin-updater`; returns update info or `null`
- `downloadAndInstallUpdate(update, onProgress)` — calls `update.downloadAndInstall()` with progress callback
- `relaunchApp()` — calls `relaunch()` from `@tauri-apps/plugin-process`
- All functions guard on `isDesktop()` and return gracefully in browser

**`apps/web/src/hooks/useAppUpdate.ts`** — React hook:
- On mount (if desktop), calls `checkForUpdate()` silently
- Optionally re-checks on an interval (e.g. every 30 minutes)
- Exposes state: `{ updateAvailable, version, downloading, progress, error, install, dismiss }`
- `install()` triggers download → install → relaunch flow
- `dismiss()` hides the banner (stores dismissed version in localStorage to avoid nagging)

**`apps/web/src/components/app-update-banner.tsx`** — UI component:
- Renders only when `updateAvailable` is true and not dismissed
- Sticky banner at top of viewport (above header) or toast notification
- Shows: "Update available: v{version}" with "Update Now" and "Later" buttons
- During download: shows progress bar with percentage
- After install: "Restarting..." with spinner
- Uses existing toast system from `hooks/use-toast.ts` for error notifications
- Only renders inside Tauri (guarded by `useIsDesktop()`)

**Integration point:** Mount `<AppUpdateBanner />` in the app's root layout so it's always visible when an update is available. The existing app layout is the right place (near `<Toaster />`).

### 11. CI/CD Changes (`.github/workflows/desktop-release.yml`)

**a) Add signing env var to build steps:**

Both the macOS and Linux/Windows Tauri build steps need:

```yaml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

When `createUpdaterArtifacts` is set and `TAURI_SIGNING_PRIVATE_KEY` is present, Tauri automatically generates `.sig` files alongside each bundle artifact.

**b) Find and read `.sig` file after build:**

After the "Find built file" step, add a step to locate and read the signature:

```yaml
- name: Find signature file
  id: find_sig
  shell: bash
  run: |
    cd "${{ matrix.bundle_path }}"
    SIG_FILE=$(ls *.sig 2>/dev/null | head -1)
    if [ -n "$SIG_FILE" ]; then
      SIGNATURE=$(cat "$SIG_FILE")
      echo "signature=$SIGNATURE" >> $GITHUB_OUTPUT
      echo "Found signature: $SIG_FILE"
    else
      echo "signature=" >> $GITHUB_OUTPUT
      echo "No .sig file found (unsigned build)"
    fi
```

**c) Upload `.sig` files to S3:**

The existing `aws s3 sync` step already syncs the entire bundle directory, so `.sig` files will be uploaded automatically.

**d) Pass signature in API registration:**

Update the "Register release with API" step to include the signature:

```yaml
- name: Register release with API
  shell: bash
  run: |
    curl --fail -X POST "${{ env.API_URL }}/releases" \
      -H "Content-Type: application/json" \
      -H "X-Release-Secret: ${{ secrets.RELEASE_SECRET }}" \
      -d '{
        "version": "${{ steps.version.outputs.version }}",
        "platform": "${{ matrix.artifact_name }}",
        "downloadUrl": "${{ env.API_URL }}/uploads/releases/v${{ steps.version.outputs.version }}/${{ steps.find_file.outputs.file }}",
        "fileSize": ${{ steps.find_file.outputs.size }},
        "fileName": "${{ steps.find_file.outputs.file }}",
        "sha256": "${{ steps.find_file.outputs.sha256 }}",
        "signature": "${{ steps.find_sig.outputs.signature }}"
      }'
```

### 12. Windows NSIS Considerations

- Windows uses NSIS installer. With `createUpdaterArtifacts: "v2Compatible"`, Tauri generates an NSIS updater artifact (`.nsis.zip` + `.nsis.zip.sig`) in addition to the regular `*-setup.exe`
- The updater `url` for Windows should point to the `.nsis.zip` file, not the `.exe` installer
- The CI matrix for Windows needs to find both the `.exe` (for download page) and the `.nsis.zip` (for updater endpoint)
- Register **two** releases for Windows: one with the `.exe` download URL (for the website) and one with the `.nsis.zip` URL (for the updater), OR serve the `.nsis.zip` URL specifically from the update endpoint

**Recommended approach:** Store the `.nsis.zip` URL as an additional field or handle it in the update endpoint by constructing the correct artifact URL based on platform. Simplest: in the update endpoint, if platform is `windows`, replace the `.exe` filename in the download URL with the corresponding `.nsis.zip` filename pattern.

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `packages/database/src/schema/releases.ts` | Add `signature` column + update Zod schemas |
| 2 | `apps/api/src/routes/releases.ts` | Add `GET /releases/update/:target/:current_version` endpoint; update `POST /releases` to accept `signature` |
| 3 | `apps/api/src/validation/releases.ts` | Add `signature` to `createReleaseSchema`; add `updateCheckParamSchema` |
| 4 | `apps/desktop/src-tauri/tauri.conf.json` | Add `createUpdaterArtifacts` + `plugins.updater` config |
| 5 | `apps/desktop/src-tauri/Cargo.toml` | Add `tauri-plugin-updater` + `tauri-plugin-process` |
| 6 | `apps/desktop/src-tauri/src/lib.rs` | Register updater + process plugins |
| 7 | `apps/desktop/src-tauri/capabilities/default.json` | Add `updater:default` + `process:allow-restart` permissions |
| 8 | `apps/web/package.json` | Add `@tauri-apps/plugin-updater` + `@tauri-apps/plugin-process` |
| 9 | `apps/web/src/lib/updater.ts` | **New** — updater utility functions |
| 10 | `apps/web/src/hooks/useAppUpdate.ts` | **New** — React hook for update state |
| 11 | `apps/web/src/components/app-update-banner.tsx` | **New** — update notification UI |
| 12 | `.github/workflows/desktop-release.yml` | Add signing key env, find `.sig` files, pass signature to API |

## Flow

```
App starts → useAppUpdate hook calls check() → Tauri plugin hits GET /releases/update/:target/:current_version
  → API maps target, queries DB, compares versions
  → 204 (no update) → hook sets updateAvailable=false → nothing shown
  → 200 (update JSON) → hook sets updateAvailable=true → banner appears
    → User clicks "Update Now" → downloadAndInstall() with progress → relaunch()
```

```
CI builds → Tauri signs artifacts → .sig files generated → uploaded to S3 → signature stored in DB via POST /releases
```

## Edge Cases

- **No signature in DB** — Update endpoint returns 204 (treat as no update). Never serve an unsigned update.
- **Unknown Tauri target** — Return 400 with descriptive error.
- **Network failure during download** — Show error in banner with "Retry" button. Tauri plugin handles partial download cleanup.
- **User dismisses update** — Store dismissed version in localStorage. Don't nag again for that version. Show again for newer versions.
- **Running in browser** — All updater code guards on `isDesktop()`. Components don't render. No errors.
- **First release after enabling updater** — Existing installs won't have the updater plugin. Users on old versions must update manually one last time. The download page continues to work as before.
- **Windows NSIS artifact path** — The update endpoint must serve the `.nsis.zip` URL for Windows, not the `.exe` URL. Handle this mapping in the endpoint logic.
- **macOS both architectures** — Each architecture gets its own release row and signature. The Tauri target (`darwin-aarch64` vs `darwin-x86_64`) maps to the correct platform.
- **Concurrent update checks** — The hook should debounce/deduplicate checks to avoid multiple simultaneous requests.
- **App relaunch failure** — If `relaunch()` fails, show a message asking the user to restart manually.
