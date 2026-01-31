# Desktop Releases

Guide for building and releasing the Open Sunsama desktop app across all platforms.

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Trigger Release** | `git tag v1.x.x && git push origin v1.x.x` |
| **Manual Trigger** | GitHub → Actions → Desktop Release → Run workflow |
| **Check Status** | GitHub → Actions → Desktop Release |
| **Downloads Page** | https://opensunsama.com/download |

---

## Release Workflow

### 1. Update Version (Required First)

```bash
# Edit version in root package.json
# Then sync to all apps:
bun run version:sync
git add -A && git commit -m "chore: bump version to 1.x.x"
git push
```

### 2. Create Release Tag

```bash
git tag v1.x.x
git push origin v1.x.x
```

This triggers the GitHub Actions workflow which:
1. Builds for all platforms (macOS arm64/x64, Windows, Linux)
2. Uploads artifacts to S3 bucket
3. Registers releases in database via API
4. Downloads page auto-updates with new builds

### 3. Manual Trigger (Alternative)

1. Go to **GitHub → Actions → Desktop Release**
2. Click **Run workflow**
3. Select branch (usually `main`)
4. Click **Run workflow** button

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
