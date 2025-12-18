# Tauri Auto-Update Template

A production-ready Tauri desktop app template with automatic updates, centralized logging, and CI/CD workflows.

## ✨ Features

- **Auto-Updates**: Built-in update mechanism with cryptographic signatures
- **Centralized Logging**: Daily rotation with monthly cleanup
- **GitHub Actions**: Automated build and release for Windows, macOS, and Linux
- **Developer Tools**: Makefile with common development commands
- **Type-Safe**: TypeScript frontend with Rust backend

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [Rust](https://rustup.rs/)
- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (optional, but recommended for easier setup)

### Setup (First Time)

1. **Create a new repository from this template:**
   ```bash
   # On GitHub, click "Use this template"
   # OR clone/fork this repository
   git clone https://github.com/yourusername/your-new-app.git
   cd your-new-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the initialization script:**
   ```bash
   npm run init
   ```

   This will:
   - Detect your GitHub repository
   - Generate cryptographic signing keys
   - Update configuration files with your app details
   - (Optional) Automatically set GitHub secrets if you have `gh` CLI

4. **Validate your setup:**
   ```bash
   npm run validate
   ```

5. **Test locally:**
   ```bash
   npm run tauri:dev
   ```

6. **Create your first release:**
   ```bash
   git add .
   git commit -m "Initial setup from template"
   git tag v0.1.0
   git push origin main --tags
   ```

   GitHub Actions will automatically build your app for all platforms and create a release!

## 📦 Development

### Available Commands

#### Via npm:
- `npm run dev` - Start Vite development server
- `npm run tauri:dev` - Start Tauri app in development mode
- `npm run tauri:build` - Build production app
- `npm run validate` - Validate your configuration
- `npm run check` - Run TypeScript type checking

#### Via Makefile:
```bash
make help           # Show all available commands
make dev            # Start development with hot reload
make build          # Build production app
make logs           # Show log directory and files
make logs-tail      # Follow logs in real-time
make logs-view      # View all log contents
```

### Logging

Logs are automatically written to platform-specific directories:
- **Windows**: `%APPDATA%\com.yourcompany.yourapp\logs`
- **macOS**: `~/Library/Logs/com.yourcompany.yourapp`
- **Linux**: `~/.local/share/com.yourcompany.yourapp/logs`

View logs:
```bash
make logs           # See location and list files
make logs-tail      # Follow live logs
make logs-view      # View all logs
```

## 🔄 Auto-Update Workflow

### How It Works

1. User runs your app (any version)
2. App checks for updates on startup
3. If a newer version exists, user is prompted to update
4. App downloads and installs the update
5. App restarts with new version

### Creating Updates

1. **Update version in `src-tauri/tauri.conf.json`:**
   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. **GitHub Actions automatically:**
   - Builds for all platforms
   - Signs the binaries
   - Creates a GitHub release
   - Uploads installer files and update manifests

4. **Users get notified:**
   - Next time they open the app
   - Automatic update prompt appears
   - One-click update and restart

### Verifying Updates Work

The workflow includes automatic verification:
- ✅ Checks that updater JSON files are created
- ✅ Fails loudly if auto-update won't work
- ✅ Logs detailed information about build artifacts

Check the Actions tab to see verification results.

## 🔐 Security

### Signing Keys

The template uses [minisign](https://jedisct1.github.io/minisign/) for cryptographic signing:

- **Public key**: Embedded in your app (`tauri.conf.json`)
- **Private key**: Stored in GitHub Secrets (`TAURI_SIGNING_PRIVATE_KEY`)
- **Purpose**: Ensures users only install updates signed by you

**Important:** Never commit your private key to the repository!

### Key Management

Your private key is stored at `~/.tauri/your-repo-name.key`

- Keep it safe and backed up
- Don't share it
- Don't commit it to version control

To regenerate keys:
```bash
npm run init
# Choose "yes" when asked to overwrite existing keys
```

## 📁 Project Structure

```
.
├── src/                    # Frontend source (TypeScript)
│   ├── main.ts            # App entry point with update logic
│   └── style.css
├── src-tauri/             # Backend source (Rust)
│   ├── src/
│   │   └── main.rs        # Main Rust file with logging setup
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── .github/
│   └── workflows/
│       └── release.yml    # CI/CD for releases
├── Makefile               # Development commands
├── init-template.js       # Template initialization script
└── validate-setup.js      # Configuration validation
```

## 🐛 Troubleshooting

### Updates Not Working?

1. **Check that updater JSON files are created:**
   ```bash
   gh release view v0.1.0 --json assets --jq '.assets[].name'
   ```

   Should include files like:
   - `latest-darwin-x86_64.json`
   - `latest-linux-x86_64.json`
   - `latest-windows-x86_64.json`

2. **Check the workflow logs:**
   - Go to Actions tab on GitHub
   - Look for the "Verify updater JSON" job
   - It will show exactly what's missing

3. **Verify signing key:**
   ```bash
   # Check that public key matches in tauri.conf.json
   cat ~/.tauri/your-repo.key.pub
   ```

4. **See the diagnostic guide:**
   - Check `UPDATER_DIAGNOSIS.md` for detailed troubleshooting

### Build Failing?

Run validation:
```bash
npm run validate
```

This checks:
- Configuration files are present
- Dependencies are installed
- Signing keys are configured
- Project structure is correct

### Need Help?

- Check `UPDATE_TESTING_GUIDE.md` for testing instructions
- Check `UPDATER_DIAGNOSIS.md` for common issues
- Open an issue on GitHub

## 🎨 Customization

### App Icon

Generate icons from a PNG file:
```bash
npm run tauri:icon path/to/your/icon.png
```

This creates all required icon formats for all platforms.

### App Name and Identifier

The `npm run init` script will prompt you for these, but you can also manually update:

**In `src-tauri/tauri.conf.json`:**
```json
{
  "productName": "Your App Name",
  "identifier": "com.yourcompany.yourapp"
}
```

**In `package.json`:**
```json
{
  "name": "your-app-name"
}
```

**In `src-tauri/Cargo.toml`:**
```toml
[package]
name = "your-app-name"
description = "Your app description"
```

## 📝 License

This template is provided as-is for you to use in your own projects.

## 🙏 Credits

Built with:
- [Tauri](https://tauri.app/) - Desktop app framework
- [Vite](https://vitejs.dev/) - Frontend build tool
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Rust](https://www.rust-lang.org/) - Systems programming language
