.PHONY: help dev build run clean logs logs-tail logs-view logs-clean check validate install

# Detect the operating system
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    # Windows paths
    ifeq ($(APPDATA),)
        LOG_DIR := $(USERPROFILE)\AppData\Roaming\com.tauri.auto-update-app\logs
    else
        LOG_DIR := $(APPDATA)\com.tauri.auto-update-app\logs
    endif
    # Use PowerShell for Windows commands
    LS_CMD := powershell -Command "Get-ChildItem -Path '$(LOG_DIR)' | Sort-Object LastWriteTime -Descending"
    TAIL_CMD := powershell -Command "Get-Content -Path '$(LOG_DIR)\app.log.*' -Wait -Tail 50"
    CAT_CMD := powershell -Command "Get-Content -Path '$(LOG_DIR)\app.log.*'"
    MKDIR_CMD := powershell -Command "New-Item -ItemType Directory -Force -Path '$(LOG_DIR)'"
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        DETECTED_OS := macOS
        LOG_DIR := $(HOME)/Library/Logs/com.tauri.auto-update-app
    else
        DETECTED_OS := Linux
        LOG_DIR := $(HOME)/.local/share/com.tauri.auto-update-app/logs
    endif
    LS_CMD := ls -lth "$(LOG_DIR)"
    TAIL_CMD := tail -f "$(LOG_DIR)"/app.log.*
    CAT_CMD := cat "$(LOG_DIR)"/app.log.*
    MKDIR_CMD := mkdir -p "$(LOG_DIR)"
endif

help:
	@echo "Tauri Auto-Update App - Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev           - Start development server with hot reload"
	@echo "  make build         - Build the production app"
	@echo "  make run           - Run the production build"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make check         - Run TypeScript type checking"
	@echo "  make validate      - Validate project setup"
	@echo ""
	@echo "Logging (Detected OS: $(DETECTED_OS)):"
	@echo "  make logs          - Show log directory location"
	@echo "  make logs-path     - Print the log directory path"
	@echo "  make logs-tail     - Tail the current log file (follow live)"
	@echo "  make logs-view     - View all log files"
	@echo "  make logs-clean    - Clean old log files"
	@echo ""
	@echo "Installation:"
	@echo "  make install       - Install dependencies"

install:
	@echo "Installing dependencies..."
	npm install

dev:
	@echo "Starting development server..."
	npm run tauri:dev

build:
	@echo "Building production app..."
	npm run tauri:build

run:
	@echo "Running production build..."
	@echo "Note: Run the built executable in src-tauri/target/release/"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules/.vite
	rm -rf src-tauri/target/debug
	@echo "Clean complete. Run 'make install' if you removed node_modules."

check:
	@echo "Running TypeScript type checking..."
	npm run check

validate:
	@echo "Validating project setup..."
	npm run validate

logs:
	@echo "Log Directory Information"
	@echo "========================="
	@echo "Operating System: $(DETECTED_OS)"
	@echo "Log Directory: $(LOG_DIR)"
	@echo ""
	@echo "Log files:"
	@$(LS_CMD) 2>/dev/null || echo "No logs found yet. Run the app to generate logs."
	@echo ""
	@echo "Use 'make logs-tail' to follow the log in real-time"
	@echo "Use 'make logs-view' to view all logs"

logs-path:
	@echo $(LOG_DIR)

logs-tail:
	@echo "Tailing log file from: $(LOG_DIR)"
	@echo "Press Ctrl+C to stop"
	@echo "---"
	@$(TAIL_CMD) 2>/dev/null || (echo "No log file found. Run the app first to generate logs." && exit 1)

logs-view:
	@echo "Viewing all logs from: $(LOG_DIR)"
	@echo "---"
	@$(CAT_CMD) 2>/dev/null || (echo "No log files found. Run the app first to generate logs." && exit 1)

logs-clean:
	@echo "Cleaning old log files from: $(LOG_DIR)"
	@$(MKDIR_CMD)
	@echo "Logs older than the current month will be cleaned on next app start."
	@echo "Log cleanup is automatic - old logs are removed when the app starts."
