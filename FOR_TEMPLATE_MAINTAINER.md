# Guide for Template Maintainers

This document is for YOU - the person maintaining this template repository.

## Template Repository Overview

This is a fully-functional Tauri app template that others can use to quickly bootstrap a desktop app with auto-updates.

### What's Already Set Up

✅ **Initialization Script** (`init-template.js`)
- Detects GitHub repo automatically
- Generates signing keypair with `tauri signer generate`
- Updates all config files with user's repo details
- Optionally sets GitHub secret via `gh` CLI
- Shows clear next steps

✅ **Validation Script** (`validate-setup.js`)
- Checks all configuration files
- Verifies signing keys are set
- Validates dependencies
- Gives clear error messages

✅ **Auto-Update System**
- Tauri updater plugin integrated
- Frontend update UI (src/main.ts)
- Backend logging (src-tauri/src/main.rs)
- Cryptographic signing with minisign

✅ **Logging System**
- Platform-specific log directories
- Daily rotation, monthly cleanup
- Logs update checks, downloads, errors
- `make logs` commands for easy viewing

✅ **CI/CD Workflows**
- Builds for Windows, macOS, Linux
- Signs all binaries
- Creates GitHub releases
- Uploads updater JSON files
- Verifies that updater works (fails if not)

✅ **Developer Experience**
- Comprehensive Makefile
- Type checking
- Hot reload in development
- Clear documentation

## Template Usage Workflow

When someone uses this template, they will:

### 1. Create Repo from Template
```bash
# On GitHub: "Use this template" button
# Or fork/clone
```

### 2. Run Init Script
```bash
npm install
npm run init
```

This automatically:
- Detects their GitHub repo (e.g., `theiruser/theirapp`)
- Generates new signing keys at `~/.tauri/theirapp.key`
- Updates `tauri.conf.json` with:
  - Their public key
  - Their GitHub endpoint: `https://github.com/theiruser/theirapp/releases/latest/download/latest.json`
- Updates app name, identifier, etc.
- Asks if they want to auto-set the GitHub secret (if `gh` CLI available)

### 3. Set GitHub Secret (if not auto-set)
The script shows them exactly what to paste into:
`https://github.com/theiruser/theirapp/settings/secrets/actions/new`

### 4. Validate Setup
```bash
npm run validate
```

Checks everything is configured correctly.

### 5. Push and Release
```bash
git add .
git commit -m "Initial setup"
git tag v0.1.0
git push origin main --tags
```

GitHub Actions automatically builds and releases for all platforms!

## Maintaining This Template

### Testing the Template

To test the init script without modifying your repo:

1. **Make changes to `init-template.js`**
2. **Test in a disposable branch:**
   ```bash
   git checkout -b test-init
   node init-template.js
   # Check that it works correctly
   git reset --hard HEAD  # Undo changes
   git checkout main
   git branch -D test-init
   ```

### Updating Dependencies

```bash
npm update
cd src-tauri && cargo update
```

Test that everything still works!

### Adding Features to the Template

When adding features:
1. ✅ Test locally
2. ✅ Update `init-template.js` if config changes needed
3. ✅ Update `validate-setup.js` to check new requirements
4. ✅ Update `TEMPLATE_README.md` with documentation
5. ✅ Create an example/test release to verify it works

### Current Known Issues

**⚠️ Updater JSON Not Being Created**

The current workflow builds successfully, but the updater JSON files (`latest-<platform>.json`) are not being uploaded. Error in logs:

```
Signature not found for the updater JSON. Skipping upload...
```

**What's Working:**
- ✅ Signing keys ARE in GitHub secrets
- ✅ Bundle files (.dmg, .msi, etc.) ARE being signed
- ✅ Individual `.sig` files ARE being created

**What's NOT Working:**
- ❌ The updater manifest JSON itself is not getting signed
- ❌ This prevents the auto-update mechanism from working

**Possible Solutions:**
1. Pin `tauri-action` to a specific version (try v0.5.15 or v0.5.14)
2. Verify signing key format matches what tauri expects
3. Check if there's a version mismatch between Tauri CLI and tauri-plugin-updater
4. Manual signing workaround in the workflow

**Testing When Fixed:**
The `verify-updater` job in the workflow will pass when fixed. It checks for all platform-specific JSON files and fails loudly if any are missing.

See `UPDATER_DIAGNOSIS.md` for full technical details.

## Template File Structure

### Files Users Will Customize
- `src-tauri/tauri.conf.json` - App config (auto-updated by init script)
- `package.json` - Name/version (auto-updated by init script)
- `src-tauri/Cargo.toml` - Rust package info (auto-updated by init script)
- `src/` - Frontend code
- `src-tauri/src/` - Backend code

### Files Users Should NOT Touch
- `init-template.js` - Template setup script
- `validate-setup.js` - Validation script
- `.github/workflows/` - CI/CD configuration

### Documentation
- `TEMPLATE_README.md` - Becomes their main README (copy over README.md for template repo)
- `UPDATE_TESTING_GUIDE.md` - How to test updates
- `UPDATER_DIAGNOSIS.md` - Troubleshooting guide
- `FOR_TEMPLATE_MAINTAINER.md` - This file (you can delete from releases)

## Making This a GitHub Template

1. **Clean up maintainer-specific files:**
   ```bash
   # Create a clean branch for the template
   git checkout -b template-release

   # Remove maintainer guide
   rm FOR_TEMPLATE_MAINTAINER.md

   # Copy template README as main README
   cp TEMPLATE_README.md README.md
   ```

2. **On GitHub:**
   - Go to Settings
   - Check "Template repository"
   - Add description: "Production-ready Tauri desktop app with auto-updates"
   - Add topics: `tauri`, `desktop`, `auto-update`, `template`, `rust`, `typescript`

3. **Create a Release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Support for Template Users

When users have issues:

1. **Ask them to run:**
   ```bash
   npm run validate
   ```

2. **Check the "Verify updater JSON" job in their Actions**

3. **Common issues:**
   - Forgot to run `npm run init`
   - Didn't set GitHub secret
   - Signing key mismatch
   - Updater JSON not being created (known issue)

4. **Point them to documentation:**
   - `TEMPLATE_README.md` - Getting started
   - `UPDATE_TESTING_GUIDE.md` - Testing updates
   - `UPDATER_DIAGNOSIS.md` - Troubleshooting

## Roadmap / TODO

- [ ] Fix updater JSON generation issue
- [ ] Add option to customize app icon in init script
- [ ] Add more platform-specific customization options
- [ ] Add integration tests for the template
- [ ] Create video walkthrough of setup process
- [ ] Add support for pre-release/beta channels
