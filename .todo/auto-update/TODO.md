[x] Generate Ed25519 signing keypair (~/.tauri/opensunsama.key)
[x] Set TAURI_SIGNING_PRIVATE_KEY GitHub secret
[x] Add signature + updater_url columns to releases table
[x] Run database migration
[x] Add Tauri update endpoint GET /releases/update/:target/:current_version
[x] Update POST /releases to accept signature + updaterUrl
[x] Update validation schemas
[x] Add createUpdaterArtifacts: true to tauri.conf.json
[x] Add updater pubkey + endpoint URL to tauri.conf.json plugins
[x] Add tauri-plugin-updater + tauri-plugin-process to Cargo.toml
[x] Register updater + process plugins in lib.rs
[x] Add updater + process permissions to capabilities
[x] Install @tauri-apps/plugin-updater + @tauri-apps/plugin-process npm packages
[x] Create updater.ts utility functions
[x] Create useAppUpdate hook
[x] Create AppUpdateBanner component
[x] Add AppUpdateBanner to app layout
[x] Update CI/CD: add signing key env, find updater artifacts + .sig, upload to S3, pass to API
[x] Update CI/CD: add updater_bundle_path + updater_file_pattern to matrix
[x] Typecheck passes
[ ] Commit and push
[ ] Verify next desktop release builds with auto-update support
