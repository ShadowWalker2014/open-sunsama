# Desktop Releases

Guide for building and releasing the Open Sunsama desktop app across all platforms.

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Release** | `bun run release` (patch), `bun run release minor`, or `bun run release 1.2.3` |
| **Rebuild a version** | GitHub → Actions → Desktop Release → Run workflow → version `1.x.x` |
| **Re-run one platform** | Open the failed run → **Re-run failed jobs** (the API upserts, so re-runs are safe) |
| **Check Status** | https://github.com/ShadowWalker2014/open-sunsama/actions/workflows/desktop-release.yml |
| **Downloads Page** | https://opensunsama.com/download |

---

## Release Workflow

From a clean, up-to-date `main`:

```bash
bun run release
```

`scripts/release.mjs` bumps the root version, runs `version:sync`, updates `AGENTS.md`, commits `release: vX.Y.Z`, tags, and pushes. The tag push starts the workflow, which:

1. Builds each platform in parallel (about 15 minutes, 60-minute timeout per job)
2. Uploads the installer, updater file and signature to S3
3. Registers each platform with `POST /releases` (upsert)
4. Runs a `verify` job that fails unless all four platforms serve the new version and each download returns HTTP 200

### Why the builds are fast

- **The desktop app ships without marketing images.** `apps/desktop/scripts/prepare-frontend.mjs` copies `apps/web/dist` to `apps/desktop/dist` without `blog-*`, `landing/` and `og-image.png` (about 570 MB). The desktop app redirects `/` to `/app` or `/login`, so it never shows those pages.
- **Each platform builds only the package it ships:** `app,dmg` on macOS, `appimage` on Linux, `nsis` on Windows. The unused Linux `.rpm` used to take 5 hours.
- **Rust builds are cached** with `Swatinem/rust-cache`.

**macOS updater files get arch-specific names.** Tauri names both Mac updaters `Open Sunsama.app.tar.gz`, so the workflow uploads them as `Open Sunsama_<version>_macos-arm64.app.tar.gz` and `..._macos-x64.app.tar.gz`. Before this, the second Mac build overwrote the first, and one architecture's auto-update failed its signature check.

---

## Build Outputs

| Platform | Architecture | File Type | Location |
|----------|--------------|-----------|----------|
| macOS | Apple Silicon (arm64) | `.dmg` | `releases/v{version}/` |
| macOS | Intel (x64) | `.dmg` | `releases/v{version}/` |
| Windows | x64 | `.exe` (NSIS) | `releases/v{version}/` |
| Linux | x64 | `.AppImage` | `releases/v{version}/` |

---

## Required Secrets

### GitHub Repository Secrets

Location: **Repo → Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `AWS_S3_BUCKET_NAME` | Railway S3 bucket name |
| `AWS_ACCESS_KEY_ID` | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key |
| `AWS_ENDPOINT_URL` | Railway S3 endpoint |
| `AWS_DEFAULT_REGION` | S3 region (e.g., `us-east-1`) |
| `RELEASE_SECRET` | API auth for registering releases |

### Railway API Environment Variables

Location: **Railway → API Service → Variables**

| Variable | Description |
|----------|-------------|
| `RELEASE_SECRET` | Must match GitHub secret |

### Generate RELEASE_SECRET

```bash
openssl rand -base64 32
```

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/releases` | GET | Public | List all releases |
| `/releases/latest` | GET | Public | Latest release per platform |
| `/releases/:platform` | GET | Public | Latest for specific platform |
| `/releases` | POST | `X-Release-Secret` | Register new release (CI only) |

---

## Troubleshooting

### Build Failed

1. Check GitHub Actions logs for specific error
2. Common issues:
   - Missing secrets → Add in GitHub Settings
   - Rust toolchain issues → Usually auto-resolves on retry
   - Code signing (macOS) → Not configured, builds are unsigned

### Release Not Showing on Downloads Page

1. Verify workflow completed successfully
2. Check API logs for registration errors
3. Verify `RELEASE_SECRET` matches in GitHub and Railway
4. Test API: `curl https://api.opensunsama.com/releases/latest`

### S3 Upload Failed

1. Verify all AWS_* secrets are set correctly
2. Check bucket permissions allow uploads
3. Verify endpoint URL is correct for Railway S3

---

## Local Development Build

```bash
# Build web app first
cd apps/web && bun run build

# Build desktop (current platform only)
cd apps/desktop && bun run tauri build

# Output location
# macOS: apps/desktop/src-tauri/target/release/bundle/dmg/
# Windows: apps/desktop/src-tauri/target/release/bundle/nsis/
# Linux: apps/desktop/src-tauri/target/release/bundle/appimage/
```

---

## Workflow File

Location: `.github/workflows/desktop-release.yml`

Triggers:
- Push tags matching `v*`
- Manual workflow dispatch

Matrix builds:
- `macos-latest` (builds both arm64 and x64)
- `ubuntu-22.04` (Linux)
- `windows-latest` (Windows)
