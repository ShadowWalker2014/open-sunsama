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
bun run release          # patch
bun run release minor    # or major, or an exact x.y.z
```

This does steps 1-3 of the golden rules, commits, tags and pushes. The tag starts the desktop build. See `.skills/desktop-releases/SKILL.md`.

## Verify Sync

```bash
grep -r '"version":' package.json apps/*/package.json apps/*/src-tauri/tauri.conf.json 2>/dev/null
```

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | 2026-01-30 | Initial release |
| v1.0.7 | 2026-02-11 | Desktop release build |
| v1.0.10 | 2026-03-21 | Desktop release build |
| v1.0.11 | 2026-07-13 | Desktop release build |
| v1.0.12 | 2026-09-23 | Desktop release build |
