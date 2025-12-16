# Quick Reference

## Essential Commands

### Development
```bash
npm run tauri:dev         # Run app in development mode
npm run check             # Check TypeScript types
```

### Building
```bash
npm run tauri:build       # Build production app for current platform
```

### Icons
```bash
npm run tauri:icon <file> # Generate all icon formats from source image
```

## Setup Checklist

### Initial Setup
- [ ] `npm install` - Install dependencies
- [ ] `npm run tauri signer generate -- -w ~/.tauri/myapp.key` - Generate keys
- [ ] Add public key to `src-tauri/tauri.conf.json`
- [ ] Update GitHub repo URL in `src-tauri/tauri.conf.json`
- [ ] Set GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY`

### Before First Release
- [ ] Update app name in `src-tauri/tauri.conf.json` (productName, identifier)
- [ ] Update app metadata in `src-tauri/Cargo.toml` (name, version, description, authors)
- [ ] Update `package.json` (name, version)
- [ ] Generate custom icons: `npm run tauri:icon your-icon.png`
- [ ] Test local build: `npm run tauri:build`

## Release Process

### Quick Release
```bash
# 1. Update version in src-tauri/Cargo.toml
# 2. Run these commands:
git add .
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

### Version Bumping
- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

## File Locations

### Configuration
- `src-tauri/tauri.conf.json` - Tauri config + updater settings
- `src-tauri/Cargo.toml` - Rust dependencies + **app version**
- `package.json` - Frontend dependencies

### Source Code
- `src/main.ts` - Frontend logic + updater integration
- `src/style.css` - UI styling
- `src-tauri/src/main.rs` - Rust backend + plugins

### Build Output
- `src-tauri/target/release/bundle/` - Built installers

## Troubleshooting Quick Fixes

### Update Not Working
1. Check `tauri.conf.json` endpoint URL
2. Verify public key matches private key
3. Ensure GitHub Release has `latest.json`
4. Check browser console for errors (Ctrl+Shift+I)

### Build Fails
1. Check Cargo.toml syntax
2. Run `cargo check` in `src-tauri/`
3. Verify platform dependencies installed (see SETUP.md)

### CI/CD Fails
1. Verify GitHub Secrets are set correctly
2. Check Actions tab for specific error
3. Ensure tag format is `vX.Y.Z`

## Key Files to Edit

When customizing your app, you'll mainly edit:
- `src/main.ts` - App functionality
- `src/style.css` - Visual styling
- `src-tauri/tauri.conf.json` - App metadata & updater config
- `src-tauri/Cargo.toml` - Version number
- `README.md` - Documentation

## Important URLs (Update These!)

In `src-tauri/tauri.conf.json`:
```json
"endpoints": [
  "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
]
```

## Common Mistakes

1. **Forgetting to bump version** - Update `Cargo.toml` before tagging
2. **Wrong tag format** - Must be `vX.Y.Z`, not just `X.Y.Z`
3. **Public/private key mismatch** - Keys must be from same generation
4. **Missing GitHub secrets** - Both secrets must be set before first release
5. **Not testing locally** - Always run `npm run tauri:build` before releasing

## Useful GitHub Actions

- View workflows: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- View releases: `https://github.com/YOUR_USERNAME/YOUR_REPO/releases`

## Testing Updates Locally

1. Install version 0.1.0
2. Create release 0.2.0 on GitHub
3. Run installed app
4. Click "Check for Updates"
5. Verify update downloads and installs

## Getting Help

- [Tauri Discord](https://discord.gg/tauri)
- [Tauri Documentation](https://tauri.app/)
- [GitHub Issues](https://github.com/tauri-apps/tauri/issues)
