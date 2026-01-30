---
name: versioning
description: Manage software versions across the Open Sunsama monorepo. Use when releasing new versions, updating version numbers, building apps for distribution, or when any version-related task is mentioned. Triggers on keywords like "version", "release", "v1.x.x", "bump", "publish", "deploy app".
---

# Versioning

All apps share ONE version. Semantic Versioning: `MAJOR.MINOR.PATCH`

## Golden Rules

1. **ONLY edit version in `package.json` (root)** - Never touch other files manually
2. **ALWAYS run `bun run version:sync`** after changing version
3. **ALWAYS tag releases** with `git tag -a vX.Y.Z`

## When to Increment

| Type | When | Example |
|------|------|---------|
| MAJOR | Breaking changes, DB migrations, API changes | 1.0.0 → 2.0.0 |
| MINOR | New features (backwards compatible) | 1.0.0 → 1.1.0 |
| PATCH | Bug fixes, small improvements | 1.0.0 → 1.0.1 |

## Files (Auto-Synced by `version:sync`)

```
package.json (root)           ← SOURCE OF TRUTH
├── apps/api/package.json
├── apps/web/package.json
├── apps/desktop/package.json
├── apps/desktop/src-tauri/tauri.conf.json
├── apps/mobile/package.json
├── apps/mobile/src-tauri/tauri.conf.json
└── apps/expo-mobile/package.json
```

## Release Workflow

```bash
# 1. Edit root package.json version (e.g., "1.0.0" → "1.1.0")

# 2. Sync all apps
bun run version:sync

# 3. Build (as needed)
cd apps/desktop && unset CI && bunx tauri build    # Desktop
cd apps/mobile && bunx tauri ios build             # iOS
cd apps/mobile && bunx tauri android build         # Android

# 4. Commit and tag
git add -A
git commit -m "release: v1.1.0"
git tag -a v1.1.0 -m "Release v1.1.0"
git push && git push --tags
```

## Verify Sync

```bash
grep -r '"version":' package.json apps/*/package.json apps/*/src-tauri/tauri.conf.json 2>/dev/null
```

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | 2026-01-30 | Initial release |
