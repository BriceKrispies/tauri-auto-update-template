#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri_plugin_updater::UpdaterExt;
use time::OffsetDateTime;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

fn setup_logging() -> Result<PathBuf, Box<dyn std::error::Error>> {
    // Determine the log directory based on the platform
    let log_dir = if cfg!(target_os = "windows") {
        dirs::data_dir()
            .ok_or("Could not find data directory")?
            .join("com.tauri.auto-update-app")
            .join("logs")
    } else if cfg!(target_os = "macos") {
        dirs::home_dir()
            .ok_or("Could not find home directory")?
            .join("Library")
            .join("Logs")
            .join("com.tauri.auto-update-app")
    } else {
        // Linux
        dirs::data_local_dir()
            .ok_or("Could not find local data directory")?
            .join("com.tauri.auto-update-app")
            .join("logs")
    };

    // Create log directory if it doesn't exist
    fs::create_dir_all(&log_dir)?;

    // Clean up old log files (keep only current month)
    cleanup_old_logs(&log_dir)?;

    // Set up file appender with daily rotation
    let file_appender = tracing_appender::rolling::daily(&log_dir, "app.log");

    // Set up console and file logging
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,tauri=debug,tauri_plugin_updater=debug"));

    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().with_writer(std::io::stdout))
        .with(
            fmt::layer()
                .with_writer(file_appender)
                .with_ansi(false)
                .with_target(true)
                .with_thread_ids(true),
        )
        .init();

    tracing::info!("Logging initialized. Log directory: {:?}", log_dir);

    Ok(log_dir)
}

fn cleanup_old_logs(log_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let now = OffsetDateTime::now_utc();
    let current_month = now.month();
    let current_year = now.year();

    if let Ok(entries) = fs::read_dir(log_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        let modified_time = OffsetDateTime::from(modified);
                        // Delete files older than current month
                        if modified_time.year() < current_year
                            || (modified_time.year() == current_year
                                && modified_time.month() < current_month)
                        {
                            tracing::info!("Cleaning up old log file: {:?}", path);
                            let _ = fs::remove_file(path);
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

fn main() {
    // Set up logging
    let log_dir = setup_logging().expect("Failed to set up logging");

    tracing::info!("Starting Tauri Auto-Update App");
    tracing::info!("Version: {}", env!("CARGO_PKG_VERSION"));
    tracing::info!("Logs will be written to: {:?}", log_dir);

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            tracing::info!("Tauri app setup complete");

            // Log update checker initialization
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tracing::info!("Starting update check...");
                match handle.updater_builder().build() {
                    Ok(updater) => match updater.check().await {
                        Ok(Some(update)) => {
                            tracing::info!(
                                "Update available! Version: {}, Date: {:?}",
                                update.version,
                                update.date
                            );
                            tracing::info!(
                                "Update body: {}",
                                update.body.as_ref().map(|s| s.as_str()).unwrap_or("")
                            );

                            match update.download_and_install(|chunk, total| {
                                tracing::debug!(
                                    "Downloaded {} of {:?} bytes",
                                    chunk,
                                    total
                                );
                            }, || {
                                tracing::info!("Download complete, preparing to install...");
                            }).await {
                                Ok(_) => {
                                    tracing::info!("Update installed successfully! Restart required.");
                                }
                                Err(e) => {
                                    tracing::error!("Failed to install update: {}", e);
                                }
                            }
                        }
                        Ok(None) => {
                            tracing::info!("No updates available. App is up to date.");
                        }
                        Err(e) => {
                            tracing::error!("Failed to check for updates: {}", e);
                        }
                    },
                    Err(e) => {
                        tracing::error!("Failed to build updater: {}", e);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
