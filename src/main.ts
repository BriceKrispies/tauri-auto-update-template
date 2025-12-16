import "./style.css";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

const updateStatus = document.getElementById("update-status")!;
const checkUpdateBtn = document.getElementById("check-update-btn")!;
const appVersionEl = document.getElementById("app-version")!;

function setStatus(msg: string) {
  updateStatus.textContent = msg;
  console.log("[Updater]", msg);
}

async function checkForUpdates() {
  try {
    setStatus("Checking for updates...");
    checkUpdateBtn.setAttribute("disabled", "true");

    const update = await check();

    if (update) {
      setStatus(`Update available: ${update.version} (current: ${update.currentVersion})`);

      const yes = await ask(
        `Update to version ${update.version} is available!\n\nRelease notes:\n${update.body}\n\nDownload and install?`,
        {
          title: "Update Available",
          kind: "info",
        }
      );

      if (yes) {
        setStatus("Downloading update...");

        let downloadedBytes = 0;
        let totalBytes = 0;
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              totalBytes = event.data.contentLength || 0;
              setStatus(`Started download${totalBytes > 0 ? ` (${totalBytes} bytes)` : "..."}`);
              break;
            case "Progress":
              downloadedBytes += event.data.chunkLength;
              const progress = totalBytes > 0
                ? `${downloadedBytes} / ${totalBytes} bytes`
                : `${downloadedBytes} bytes`;
              setStatus(`Downloaded ${progress}`);
              break;
            case "Finished":
              setStatus("Download finished");
              break;
          }
        });

        setStatus("Update installed! Restarting...");
        await message("Update installed successfully. The app will now restart.", {
          title: "Update Complete",
          kind: "info",
        });

        await relaunch();
      } else {
        setStatus("Update cancelled by user");
      }
    } else {
      setStatus("No updates available. You're on the latest version!");
    }
  } catch (error) {
    console.error("Update check failed:", error);
    setStatus(`Error checking for updates: ${error}`);
  } finally {
    checkUpdateBtn.removeAttribute("disabled");
  }
}

async function init() {
  const version = await getVersion();
  appVersionEl.textContent = version;

  checkUpdateBtn.addEventListener("click", checkForUpdates);

  // Check for updates after a short delay (non-blocking startup)
  setTimeout(() => checkForUpdates(), 2000);
}

init();
