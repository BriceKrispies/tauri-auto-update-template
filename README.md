# Tauri Auto-Update Template

A minimal, production-ready Tauri v2 desktop application with built-in auto-update functionality via GitHub Releases.

## Features

- Built with Tauri v2 for Windows, macOS, and Linux
- Auto-update mechanism using GitHub Releases
- Minimal frontend (Vite + TypeScript)
- Automated CI/CD with GitHub Actions
- Cryptographically signed updates
- In-app update UI with download progress

## Prerequisites

- Node.js 18+ and npm
- Rust (latest stable)
- Platform-specific dependencies:
  - **Linux**: `webkit2gtk`, `libappindicator3`, `librsvg2`, `patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio C++ Build Tools or Windows SDK

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tauri-auto-update-template
npm install
```

### 2. Development

Run in development mode:

```bash
npm run tauri dev
```

### 3. Build Locally

Build for your current platform:

```bash
npm run tauri build
```

## Setup Auto-Updates

### Step 1: Generate Updater Keys

Generate a keypair for signing updates:

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

This creates two files:
- Private key: `~/.tauri/myapp.key` (keep this SECRET)
- Public key: `~/.tauri/myapp.key.pub`

**Important**: Never commit the private key to version control!

### Step 2: Configure Public Key

1. Read your public key:

**Linux/macOS:**
```bash
cat ~/.tauri/myapp.key.pub
```

**Windows (PowerShell):**
```powershell
Get-Content ~\.tauri\myapp.key
```

2. Copy the public key content (it starts with `dW50cnVzdGVk...`)

3. Open `src-tauri/tauri.conf.json` and replace `UPDATER_PUBLIC_KEY_PLACEHOLDER` with your actual public key:

```json
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IERD..."
  }
}
```

### Step 3: Update GitHub Repository Reference

In `src-tauri/tauri.conf.json`, update the updater endpoint with your repository:

```json
"endpoints": [
  "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/releases/latest/download/latest.json"
]
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

Alternatively, you can use the template format (the workflow will need your repo set correctly):

```json
"endpoints": [
  "https://github.com/{{owner}}/{{repo}}/releases/latest/download/latest.json"
]
```

### Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **TAURI_SIGNING_PRIVATE_KEY**
   - Read your private key file:
     ```bash
     cat ~/.tauri/myapp.key
     ```
   - Copy the ENTIRE content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Paste into GitHub secret

2. **TAURI_SIGNING_PRIVATE_KEY_PASSWORD** (optional)
   - If you set a password when generating the key, add it here
   - If no password, you can either:
     - Leave this secret empty/not create it, OR
     - Set it to an empty string

### Step 5: Configure App Metadata

Update these files with your app information:

**`src-tauri/tauri.conf.json`:**
```json
{
  "productName": "YourAppName",
  "identifier": "com.yourcompany.yourapp"
}
```

**`src-tauri/Cargo.toml`:**
```toml
[package]
name = "your-app-name"
version = "0.1.0"
description = "Your app description"
authors = ["Your Name"]
```

**`package.json`:**
```json
{
  "name": "your-app-name",
  "version": "0.1.0"
}
```

**Important**: The version in `src-tauri/Cargo.toml` is the single source of truth for versioning.

## Release Process

### Creating a Release

1. **Update Version**

   Edit `src-tauri/Cargo.toml`:
   ```toml
   [package]
   version = "0.2.0"  # Bump version
   ```

2. **Commit and Tag**

   ```bash
   git add .
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. **Automated Build**

   GitHub Actions will automatically:
   - Build installers for Windows, macOS, and Linux
   - Sign all artifacts
   - Create a GitHub Release
   - Upload installers and signatures
   - Generate `latest.json` for the updater

4. **Monitor Release**

   - Go to your repository's Actions tab
   - Watch the "Release" workflow
   - Once complete, check the Releases page

### Release Artifacts

Each release includes:
- **Windows**: `.msi` installer + `.msi.sig`
- **macOS**: `.dmg` bundle + `.dmg.sig` (universal binary)
- **Linux**: `.AppImage` + `.AppImage.sig`, `.deb` + `.deb.sig`
- **Updater**: `latest.json` (manifest for auto-updates)

## How Auto-Update Works

### User Experience

1. **On App Launch**: The app automatically checks for updates
2. **Update Found**: User sees a dialog with release notes
3. **User Confirms**: Update downloads with progress indicator
4. **Install**: Update applies and app restarts automatically

### Technical Flow

1. App queries: `https://github.com/owner/repo/releases/latest/download/latest.json`
2. Compares remote version with current version
3. If newer version exists:
   - Verifies signature using public key
   - Downloads installer
   - Validates downloaded file
   - Installs update
   - Restarts application

### Update Check Behavior

- **Automatic**: Checks on every app launch
- **Manual**: User can click "Check for Updates" button
- **Silent**: No notification if already up-to-date
- **Secure**: All updates are cryptographically verified

## Customization

### Change App Icon

1. Create a 1024x1024 PNG icon: `app-icon.png`
2. Generate all formats:
   ```bash
   npm run tauri icon app-icon.png
   ```

### Modify Frontend

Edit files in `src/`:
- `main.ts` - Application logic
- `style.css` - Styling
- `index.html` - HTML structure

### Customize Update UI

Edit `src/main.ts` to modify:
- Update check timing
- Dialog messages
- Progress display
- User confirmation flow

### Change Bundle Targets

Edit `src-tauri/tauri.conf.json`:

```json
"bundle": {
  "targets": ["msi", "nsis", "deb", "appimage", "dmg"]
}
```

Available targets:
- Windows: `msi`, `nsis`
- macOS: `dmg`, `app`
- Linux: `deb`, `appimage`, `rpm`

## Testing Updates

### Test Update Mechanism Locally

1. Build and install version `0.1.0`
2. Bump version to `0.2.0` in `Cargo.toml`
3. Create a release on GitHub with tag `v0.2.0`
4. Run the installed app
5. App should detect and offer the update

### Test Without Publishing

For development testing, you can:

1. Build a release locally:
   ```bash
   npm run tauri build
   ```

2. Host `latest.json` on a local server

3. Update `tauri.conf.json` endpoints to point to localhost

4. Test the update flow

## Troubleshooting

### Update Check Fails

- **Check network connectivity**
- **Verify endpoint URL** in `tauri.conf.json`
- **Ensure public key** matches the private key used for signing
- **Check GitHub Release** exists and contains `latest.json`

### Signature Verification Fails

- **Mismatch between keys**: Public key in app doesn't match private key used to sign
- **Corrupted download**: Network issue during download
- **Wrong latest.json format**: Check the JSON structure

### Build Fails in CI

- **Check secrets**: Ensure `TAURI_SIGNING_PRIVATE_KEY` is set correctly
- **Verify Cargo.toml**: Syntax errors will break builds
- **Check dependencies**: Platform-specific deps might be missing

### App Doesn't Show Update

- **Version comparison**: Ensure new version is higher (use semver)
- **Cache**: Clear app data and restart
- **Logs**: Check browser console in dev tools (Ctrl+Shift+I)

## Architecture

### Project Structure

```
tauri-auto-update-template/
├── src/                    # Frontend source
│   ├── main.ts            # App logic + updater integration
│   └── style.css          # Styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── main.rs        # Tauri app entry + plugins
│   ├── tauri.conf.json    # Tauri configuration + updater settings
│   ├── Cargo.toml         # Rust dependencies + version
│   └── icons/             # App icons
├── .github/
│   └── workflows/
│       └── release.yml    # CI/CD pipeline
└── package.json           # Frontend dependencies
```

### Key Files

- **`src-tauri/Cargo.toml`**: Single source of truth for app version
- **`src-tauri/tauri.conf.json`**: Updater config, bundle settings, app metadata
- **`src/main.ts`**: Update check logic and UI
- **`.github/workflows/release.yml`**: Build, sign, and release automation

## Security Notes

- **Private key**: Never commit to git, never share publicly
- **GitHub Secrets**: Encrypted at rest, only accessible to workflows
- **Signature verification**: Prevents malicious updates
- **HTTPS only**: All update downloads use HTTPS
- **Version pinning**: Users can't be downgraded to older versions

## Pre-Release Checklist

Before creating your first release:

- [ ] Generate updater keypair
- [ ] Add public key to `tauri.conf.json`
- [ ] Add private key to GitHub Secrets
- [ ] Update GitHub repository URL in `tauri.conf.json`
- [ ] Customize app name, identifier, and description
- [ ] Replace app icon (optional)
- [ ] Test build locally: `npm run tauri build`
- [ ] Update README with your app specifics
- [ ] Commit all changes to main branch
- [ ] Create and push first tag: `git tag v0.1.0 && git push --tags`
- [ ] Verify GitHub Actions workflow completes
- [ ] Download and test installer from GitHub Release
- [ ] Install v0.1.0, then release v0.2.0 to test update flow

## License

MIT

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri Updater Guide](https://tauri.app/v1/guides/distribution/updater/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
