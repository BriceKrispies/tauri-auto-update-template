# CI Verification Guide

This guide explains the 2-path CI setup and how to verify it's working correctly.

## Overview

The repository now has two distinct CI paths:

1. **Fast Path (ci.yml)**: For PRs and pushes to main - aggressive caching, quick checks/builds
2. **Hermetic Release Path (release.yml)**: For tags/releases - deterministic, reproducible builds

## Path A: Fast CI (ci.yml)

### Triggers
- Pull requests to `main`
- Pushes to `main` branch
- Manual dispatch via GitHub Actions UI

### What It Does
1. **Builds on all platforms** (Linux, macOS, Windows)
2. **Uses aggressive Rust caching**:
   - `~/.cargo/registry` (dependency downloads)
   - `~/.cargo/git` (git dependencies)
   - `src-tauri/target` (build artifacts)
3. **Cache key includes**:
   - OS platform
   - Rust toolchain version (1.83.0)
   - Cargo.lock hash (automatic via rust-cache)
4. **Runs checks**:
   - Rust formatting (`cargo fmt`)
   - Clippy lints (`cargo clippy`)
   - Debug build (fast compilation)

### Verifying Fast Path Caching

#### First Run (Cache Miss)
1. Open a PR or push to main
2. Go to Actions tab > "CI - Fast Path" workflow
3. Click on the running/completed workflow
4. Look for the **"Rust cache (with verification)"** step
5. You should see:
   ```
   Cache hit: false
   Cache primary key: v1-rust-ci-fast-ubuntu-22.04-<hash>
   ```
6. Check **"Verify Rust cache configuration"** step - it shows cache dirs
7. Build time will be ~5-10 minutes (fresh build)

#### Second Run (Cache Hit)
1. Make another commit or re-run the workflow
2. In the **"Rust cache (with verification)"** step, you should now see:
   ```
   Cache hit: true
   Cache primary key: v1-rust-ci-fast-ubuntu-22.04-<same-hash>
   ```
3. Build time should drop to ~2-3 minutes
4. The **"Cache Reuse Verification"** job demonstrates cross-job cache reuse

#### Cache Verification Outputs
The workflow includes several verification steps that print:
- Cache hit/miss status
- Cache primary key
- Cargo cache directory sizes
- Target directory sizes
- Timing information

Look for these sections in the logs:
- `=== Rust Cache Verification ===`
- `=== Post-Build Cache Verification ===`
- `=== Cache Reuse Test Results ===`

### Cache Invalidation
The cache will be invalidated (rebuilt) when:
- Cargo.lock changes (new dependencies)
- Rust toolchain version changes
- OS platform changes
- Cache prefix key changes

## Path B: Hermetic Release (release.yml)

### Triggers
- Git tags matching `v*` (e.g., `v1.0.0`, `v2.1.3`)
- GitHub Releases published

### What Makes It Hermetic

#### Linux (release-linux job)
- **Runs in Docker container**: `ubuntu:22.04` (pinned)
- **Deterministic base environment**: Fresh container every time
- **All dependencies installed explicitly** in the container
- **No reliance on runner state**: Clean slate for every build

#### macOS (release-macos job)
- **Pinned toolchains**: Rust 1.83.0, Node 20.11.0
- **Pinned action SHAs**: All actions use commit SHAs, not tags
- **Minimal cache usage**: Only for incremental builds, not dependencies

#### Windows (release-windows job)
- **Pinned toolchains**: Rust 1.83.0, Node 20.11.0
- **Pinned action SHAs**: All actions use commit SHAs, not tags
- **Deterministic npm installs**: Uses `npm ci` instead of `npm install`

### Pinned Versions
All critical versions are explicitly pinned:

| Component | Version | Pin Type |
|-----------|---------|----------|
| Rust toolchain | 1.83.0 | Exact version |
| Node.js | 20.11.0 | Exact version |
| actions/checkout | 11bd719... | SHA |
| actions/setup-node | 3937... | SHA |
| dtolnay/rust-toolchain | 7b1c307... | SHA |
| swatinem/rust-cache | 82a92a6... | SHA (v2.7.5) |
| tauri-apps/tauri-action | 26fb4ce... | SHA (v0.5.16) |
| Ubuntu container | 22.04 | Tag (Docker image) |

### Verifying Hermetic Builds

#### 1. Check Build Environment
1. Create a tag: `git tag v0.1.0 && git push origin v0.1.0`
2. Go to Actions > "Release (Hermetic)" workflow
3. Click on each job (release-linux, release-macos, release-windows)
4. Find the **"Verify hermetic build environment"** step
5. Verify it shows:
   ```
   === Hermetic Build Environment Verification ===
   OS: <exact version>
   Rust: rustc 1.83.0
   Cargo: cargo 1.83.0
   Node: v20.11.0
   NPM: <version>
   ```

#### 2. Verify Docker Usage (Linux)
1. In the `release-linux` job, check the first step
2. Look for **"Install base dependencies in container"**
3. This confirms the build runs inside the ubuntu:22.04 container
4. All dependencies are installed from scratch each time

#### 3. Verify Determinism
1. Create two tags a few days apart (same code)
2. Compare the build logs for each
3. Tool versions should be identical:
   - Same Rust version
   - Same Node version
   - Same dependency versions (via Cargo.lock)
4. Build outputs should be identical (byte-for-byte if fully deterministic)

#### 4. Check Artifacts
1. After release completes, check the GitHub Release
2. Verify all platform artifacts are present:
   - Linux: `.AppImage`, `.deb`, updater JSON
   - macOS: `.dmg`, `.app.tar.gz`, updater JSON
   - Windows: `.msi`, `.exe`, updater JSON
3. Check the `verify-updater` job passes

### Release Path Cache Usage
The hermetic release path uses **minimal caching**:
- Cache is used only for incremental compilation speed
- Dependencies are always freshly installed
- `npm ci` ensures deterministic npm installs
- Docker container ensures clean Linux environment

This is different from fast path, which uses aggressive caching.

## Comparing Fast vs Hermetic Paths

| Aspect | Fast Path (ci.yml) | Hermetic Path (release.yml) |
|--------|-------------------|----------------------------|
| **Purpose** | Quick feedback on PRs | Reproducible release builds |
| **Trigger** | PR, push to main | Tag `v*`, release published |
| **Caching** | Aggressive (all artifacts) | Minimal (compilation only) |
| **Build Time** | 2-3 min (cached) | 8-12 min (fresh each time) |
| **Environment** | GitHub runners as-is | Docker (Linux) + pinned tools |
| **Toolchain** | Pinned but mutable runner | Fully pinned, fresh container |
| **npm install** | `npm install` | `npm ci` (deterministic) |
| **Goal** | Speed | Reproducibility |

## Common Verification Tasks

### Test Fast Path Caching
```bash
# Create a PR or push to main
git checkout -b test-ci
echo "// test" >> src-tauri/src/main.rs
git add . && git commit -m "test: verify CI caching"
git push origin test-ci

# Open PR, check Actions tab
# Run 1: Cache miss, ~5-10 min
# Run 2 (rerun): Cache hit, ~2-3 min
```

### Test Hermetic Release
```bash
# Create and push a tag
git tag v0.1.0-test
git push origin v0.1.0-test

# Check Actions tab > "Release (Hermetic)"
# Verify all three jobs run
# Check "Verify hermetic build environment" step in each
# Confirm tool versions are pinned
```

### Verify Cache Keys
In any workflow run with Rust caching:
1. Expand the "Rust cache" step
2. Look for output like:
   ```
   Cache key: v1-rust-ci-fast-ubuntu-22.04-<cargo-lock-hash>
   Cache restored from key: v1-rust-ci-fast-ubuntu-22.04-<cargo-lock-hash>
   ```
3. The key includes OS and Cargo.lock hash automatically

### Check Cache Hit Rate
1. Go to Actions tab
2. Run the same workflow multiple times (without changing Cargo.lock)
3. First run: `cache-hit: false`
4. Subsequent runs: `cache-hit: true`
5. If you change Cargo.lock (add dependency): `cache-hit: false` again

## Troubleshooting

### Fast Path: Cache Not Working
**Symptom**: Every run shows `cache-hit: false`

**Check**:
1. Are you changing Cargo.lock between runs?
2. Is the cache key consistent? (Check the "Rust cache" step output)
3. Is GitHub Actions cache storage full? (Check Settings > Actions > Caches)

**Solution**:
- Don't change dependencies between test runs
- Check cache storage limits (10 GB per repo)
- Old caches are auto-evicted after 7 days

### Hermetic Path: Build Not Reproducible
**Symptom**: Same code produces different binaries

**Check**:
1. Are tool versions actually pinned? (Check "Verify hermetic build environment")
2. Is there any floating dependency in Cargo.toml? (Should use Cargo.lock)
3. Are timestamps being embedded in the binary?

**Solution**:
- Verify all `uses:` in release.yml use commit SHAs
- Ensure Cargo.lock is committed to the repo
- Check Cargo.toml for `*` or `^` version specifiers

### GitHub Actions Shows "Action Not Found"
**Symptom**: Workflow fails with "unable to find action"

**Cause**: Pinned SHA might be incorrect or action was force-pushed

**Solution**:
- Verify the SHA exists in the action's repo
- Consider using a release tag instead of SHA if needed
- Example: `actions/checkout@v4.2.2` or use the SHA

## GitHub Actions UI Guide

### Where to Find Cache Information
1. **Actions tab** > Select workflow run
2. Click on a specific job (e.g., "Fast CI (Lint, Build, Test)")
3. Expand **"Rust cache (with verification)"** step
4. Look for these lines:
   ```
   Cache hit: true/false
   Cache primary key: <key>
   ```

### Where to Verify Hermetic Builds
1. **Actions tab** > "Release (Hermetic)" workflow
2. Click on **"release-linux"** job
3. Check **"Install base dependencies in container"** (should install from apt)
4. Check **"Verify hermetic build environment"** (shows exact versions)
5. Repeat for release-macos and release-windows jobs

### Where to See Build Times
1. In any workflow run, each step shows duration on the right
2. Compare "Build Tauri app" step between:
   - First run (cache miss): ~8-12 min
   - Second run (cache hit): ~2-3 min
3. Hermetic release builds always take ~8-12 min (fresh each time)

## Summary

You've successfully implemented a 2-path CI setup:

1. **Fast path** proves caching works when:
   - Logs show `cache-hit: true` on subsequent runs
   - Build times drop significantly (10min → 3min)
   - Cache verification steps show populated directories

2. **Hermetic release path** proves reproducibility when:
   - Logs show exact pinned versions (Rust 1.83.0, Node 20.11.0)
   - Linux builds run inside Docker container
   - All action SHAs are pinned (no floating tags)
   - Builds produce consistent artifacts

Check these indicators in the GitHub Actions UI to confirm everything is working!
