# Setup Guide

This guide walks through the complete setup process for this Tauri auto-update template.

## Automated Setup (Recommended)

The fastest way to set up a new project from this template:

```bash
# After cloning your new repository
npm install
npm run init
```

The init script will automatically:
1. Detect your GitHub repository from git remote
2. Generate signing keypairs
3. Update `tauri.conf.json` with your repo URL and public key
4. Customize app metadata (name, identifier)
5. Display your private key and GitHub secret instructions

**Then just:**
1. Add the private key to GitHub Secrets (shown in output)
2. Run `npm run validate` to verify setup
3. Create your first release: `git tag v0.1.0 && git push --tags`

---

## Manual Setup

If you prefer to set up manually or need to customize further, follow the steps below.

## Initial Setup

### 1. Install System Dependencies

**Windows:**
```powershell
# Install via Visual Studio Installer or standalone:
# - Visual Studio C++ Build Tools
# - Windows 10/11 SDK
```

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

**Linux (Fedora):**
```bash
sudo dnf install \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

### 2. Install Rust

```bash
# Install rustup (Rust installer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts, then reload shell:
source $HOME/.cargo/env
```

### 3. Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

Or use a version manager:
```bash
# Using nvm
nvm install 20
nvm use 20
```

### 4. Clone and Install Project

```bash
git clone <your-repo-url>
cd tauri-auto-update-template
npm install
```

## Configure Auto-Updates

### Generate Signing Keys

```bash
# Create directory for keys
mkdir -p ~/.tauri

# Generate keypair
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

Output:
```
Private: ~/.tauri/myapp.key
Public: ~/.tauri/myapp.key.pub
```

### Add Public Key to Config

1. Read the public key:
   ```bash
   cat ~/.tauri/myapp.key.pub
   ```

2. Copy the key (starts with `dW50cnVzdGVk...`)

3. Edit `src-tauri/tauri.conf.json`:
   ```json
   "plugins": {
     "updater": {
       "pubkey": "YOUR_PUBLIC_KEY_HERE"
     }
   }
   ```

### Configure GitHub Repository

1. Create a new GitHub repository
2. Update `src-tauri/tauri.conf.json`:
   ```json
   "endpoints": [
     "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
   ]
   ```

### Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret:

**Secret 1: TAURI_SIGNING_PRIVATE_KEY**
```bash
# Read private key
cat ~/.tauri/myapp.key

# Copy ENTIRE output including:
# untrusted comment: ...
# -----BEGIN PRIVATE KEY-----
# ...
# -----END PRIVATE KEY-----
```

**Secret 2: TAURI_SIGNING_PRIVATE_KEY_PASSWORD**
- If you set a password: paste it here
- If no password: create secret with empty value or don't create it

## Customize Your App

### Update App Metadata

**`src-tauri/Cargo.toml`:**
```toml
[package]
name = "my-awesome-app"
version = "0.1.0"
description = "My awesome application"
authors = ["Your Name <you@example.com>"]
```

**`src-tauri/tauri.conf.json`:**
```json
{
  "productName": "My Awesome App",
  "identifier": "com.yourcompany.myawesomeapp"
}
```

**`package.json`:**
```json
{
  "name": "my-awesome-app",
  "version": "0.1.0"
}
```

### Replace App Icon

```bash
# Create a 1024x1024 PNG icon
# Then generate all formats:
npm run tauri icon path/to/icon.png
```

## Test Locally

### Development Mode

```bash
npm run tauri dev
```

This opens the app with hot-reload enabled.

### Production Build

```bash
npm run tauri build
```

Outputs to: `src-tauri/target/release/bundle/`

## First Release

### Commit and Tag

```bash
git add .
git commit -m "Initial release"
git tag v0.1.0
git push origin main --tags
```

### Monitor Workflow

1. Go to GitHub → Actions tab
2. Watch "Release" workflow
3. Wait for all jobs to complete (~10-20 minutes)

### Verify Release

1. Go to GitHub → Releases
2. You should see "App v0.1.0"
3. Download and install the appropriate installer for your OS
4. Run the app - it should show "No updates available"

## Test Auto-Update

### Create Second Release

1. Edit `src-tauri/Cargo.toml`:
   ```toml
   version = "0.2.0"
   ```

2. Commit and tag:
   ```bash
   git add .
   git commit -m "Version 0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. Wait for workflow to complete

### Test Update Flow

1. Keep v0.1.0 app running
2. Click "Check for Updates"
3. Should see: "Update available: 0.2.0"
4. Click "Yes" to download and install
5. App restarts with v0.2.0

## Common Issues

### "Public key is invalid"

- Public key in `tauri.conf.json` doesn't match private key
- Regenerate keys and update both config and GitHub secret

### "Failed to fetch update"

- Check internet connection
- Verify endpoint URL is correct
- Ensure GitHub Release exists and is public

### Build fails: "linker error"

- Install platform dependencies (see step 1)
- On Windows: install Visual Studio C++ tools

### Workflow fails: "TAURI_SIGNING_PRIVATE_KEY not found"

- Add the secret in GitHub repository settings
- Ensure you copied the FULL key including headers

## Next Steps

- [ ] Customize the UI in `src/main.ts` and `src/style.css`
- [ ] Add more features to your app
- [ ] Update the README with your app details
- [ ] Add more platforms/targets as needed
- [ ] Set up a development roadmap
- [ ] Create a changelog

## Resources

- [Tauri Docs](https://tauri.app/v1/guides/)
- [Updater Plugin](https://tauri.app/v1/guides/distribution/updater/)
- [GitHub Actions](https://docs.github.com/actions)
- [Semantic Versioning](https://semver.org/)
