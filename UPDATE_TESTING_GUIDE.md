# Auto-Update Testing Guide

This guide explains how to test the end-to-end auto-update functionality of this Tauri app.

## What Was Implemented

### 1. Centralized Logging System
- **Location**: `src-tauri/src/main.rs`
- **Features**:
  - Daily log rotation with monthly cleanup (keeps only current month)
  - Platform-specific log directories:
    - **Windows**: `%APPDATA%\com.tauri.auto-update-app\logs`
    - **macOS**: `~/Library/Logs/com.tauri.auto-update-app`
    - **Linux**: `~/.local/share/com.tauri.auto-update-app/logs`
  - Logs to both console and file
  - Detailed update checking logs (start, available updates, download progress, errors)

### 2. Makefile for Development
Run `make help` to see all available commands:

**Development:**
- `make dev` - Start development server with hot reload
- `make build` - Build the production app
- `make check` - Run TypeScript type checking
- `make validate` - Validate project setup
- `make clean` - Clean build artifacts
- `make install` - Install dependencies

**Logging:**
- `make logs` - Show log directory and list files
- `make logs-path` - Print log directory path
- `make logs-tail` - Follow logs in real-time
- `make logs-view` - View all log contents
- `make logs-clean` - Info about log cleanup

## Current Status

✅ **Completed:**
- Centralized logging with rotation
- Update checker integrated and logging enabled
- Makefile with all dev and logging commands
- GitHub Actions workflow fixed and building successfully
- Release v0.1.6 created with all platform binaries

⚠️ **Remaining for Full Update Workflow:**
The `latest.json` file (required for auto-updates) is not being generated because Tauri signing is not configured.

## Setting Up Auto-Updates (Complete Process)

### Step 1: Generate Signing Keys

The signing keys are already generated (you can see the public key in `src-tauri/tauri.conf.json`). You need to:

1. Check if you have the private key locally (it should have been generated when you set this up initially)
2. Or generate a new keypair:
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/myapp.key
   ```

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **TAURI_SIGNING_PRIVATE_KEY**: The content of your private key file
2. **TAURI_SIGNING_PRIVATE_KEY_PASSWORD**: The password for the private key (if you set one)

Without these, the `latest.json` won't be generated and updates won't work.

### Step 3: Test the Update Workflow

Once signing is configured:

1. **Download and install the v0.1.4 or v0.1.5 release** from GitHub:
   - Go to: https://github.com/BriceKrispies/tauri-auto-update-template/releases
   - Download the appropriate installer for your platform
   - Install the app

2. **Run the installed app and check logs**:
   ```bash
   make logs-tail
   ```

   You should see:
   ```
   Starting Tauri Auto-Update App
   Version: 0.1.4 (or 0.1.5)
   Starting update check...
   Update available! Version: 0.1.6
   ```

3. **The app will automatically download and offer to install the update**

4. **After update, verify**:
   - The UI should show: "✅ Version 0.1.6 - With Enhanced Logging!"
   - Check logs to see the update process:
     ```bash
     make logs-view
     ```

## Testing Without Signing (Alternative)

If you want to test locally without GitHub releases:

1. Build version 0.1.4 locally
2. Run it and check logs: `make logs-tail`
3. You'll see: "No updates available" or errors about missing latest.json
4. Build version 0.1.6 locally
5. Set up a local server to serve the update files

## Verifying Logging Works

You can test the logging system immediately:

1. **Run the app in dev mode**:
   ```bash
   make dev
   ```

2. **In another terminal, tail the logs**:
   ```bash
   make logs-tail
   ```

3. **You should see**:
   - App startup messages with version info
   - Update check initiation
   - Update check results (likely "No updates" or error if latest.json doesn't exist)
   - All logs are timestamped with thread IDs

4. **Check log file location**:
   ```bash
   make logs
   ```

## Log Contents You Should See

When the app runs, you'll see logs like:

```
2025-12-18T14:00:00.123Z  INFO tauri_auto_update_app: Logging initialized. Log directory: "C:\\Users\\...\\logs"
2025-12-18T14:00:00.234Z  INFO tauri_auto_update_app: Starting Tauri Auto-Update App
2025-12-18T14:00:00.345Z  INFO tauri_auto_update_app: Version: 0.1.6
2025-12-18T14:00:00.456Z  INFO tauri_auto_update_app: Tauri app setup complete
2025-12-18T14:00:00.567Z  INFO tauri_auto_update_app: Starting update check...
2025-12-18T14:00:01.678Z  INFO tauri_auto_update_app: No updates available. App is up to date.
```

If an update is found:

```
2025-12-18T14:00:01.678Z  INFO tauri_auto_update_app: Update available! Version: 0.1.6
2025-12-18T14:00:01.789Z  INFO tauri_auto_update_app: Downloading update...
2025-12-18T14:00:02.890Z DEBUG tauri_auto_update_app: Downloaded 1024 of 5242880 bytes
...
2025-12-18T14:00:30.123Z  INFO tauri_auto_update_app: Update installed successfully! Restart required.
```

## Next Steps

To complete the auto-update workflow:

1. **Configure signing keys in GitHub secrets** (see Step 2 above)
2. **Create a new release** (v0.1.7) to regenerate the v0.1.6 release with signatures
3. **Test the full update flow** using an older version

The logging and infrastructure are all in place - you just need to configure the signing to enable the actual update mechanism.

## Troubleshooting

**No logs appearing?**
- Check the log directory exists: `make logs`
- Ensure the app has write permissions to the log directory

**Update check failing?**
- Check if `latest.json` exists: visit the GitHub releases page
- Verify signing keys are configured in GitHub secrets
- Check the logs for error messages: `make logs-view`

**Old logs not being cleaned?**
- Logs are cleaned automatically on app startup
- Only logs older than the current month are removed
