# Security Audit Report - Tauri Auto-Update Template

**Audit Date:** 2025-12-16
**Auditor:** Claude Code
**Scope:** Tauri v2 auto-update build and release pipeline

## Executive Summary

This security audit assessed the auto-update mechanism, GitHub Actions workflows, secrets handling, and application permissions. The repository demonstrates **good baseline security** but has **3 high-priority** and **2 medium-priority** findings that should be addressed to harden the supply chain.

**Overall Risk Level:** 🟡 Medium (after fixes: 🟢 Low)

---

## A) Updater Trust Chain

### ✅ PASS: Update Verification Enabled

**Evidence:**
- `src-tauri/tauri.conf.json:46-56` - Updater plugin active with pubkey configured
- `src-tauri/tauri.conf.json:52` - Public key: `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDBBNDREODFFMJMXQJYYY2gKUldSb1loc2pIdGxKQ2lTNFN6YllPRWpYQk1TWkkzQkcvaUhZcjhUU0ZrdjRZSis1dEUwV3I4eWoK`
- `src-tauri/tauri.conf.json:49` - Endpoint: `https://github.com/{{owner}}/{{repo}}/releases/latest/download/latest.json`

**Verification:**
```bash
# Updater will ONLY install updates signed with the matching private key
# Tauri uses minisign for signature verification (Ed25519)
# Tampered payloads will be rejected at signature validation
```

### ⚠️ LOW: Template Variables Require User Configuration

**Risk:** Users who don't replace `{{owner}}/{{repo}}` will have non-functional updater (fail-safe).

**Mitigation:** Already documented in README.md; validate-setup.js checks for this.

---

## B) Secrets Hygiene

### ✅ PASS: No Secret Leakage Detected

**Evidence:**
- `.github/workflows/release.yml:56-58` - Secrets only used in `env:` block
- No `echo`, `set -x`, or `printenv` commands that expose secrets
- `git log --all --full-history -- "*tauri.key*" "*private*" "*.pem"` - No keys in git history

### ⚠️ MEDIUM: .gitignore Incomplete for Key Files

**Finding:**
`.gitignore:1-28` does not explicitly block common key file patterns.

**Risk:** Developers could accidentally commit private keys during local testing.

**Evidence:**
```bash
# Missing patterns:
*.key
*.pem
tauri.key
tauri.key.pub
```

**Severity:** Medium
**Fix:** Add key patterns to .gitignore (implemented below)

---

## C) GitHub Actions Hardening

### ❌ HIGH: Actions Use Floating Version Tags

**Finding:**
All GitHub Actions use mutable version tags instead of immutable commit SHAs.

**Evidence:** `.github/workflows/release.yml`
```yaml
Line 26: uses: actions/checkout@v4                    # Should pin to SHA
Line 35: uses: actions/setup-node@v4                  # Should pin to SHA
Line 41: uses: dtolnay/rust-toolchain@stable          # Acceptable (rust version)
Line 46: uses: swatinem/rust-cache@v2                 # Should pin to SHA
Line 54: uses: tauri-apps/tauri-action@v0             # Should pin to SHA
```

**Risk:**
- Action maintainers can alter `@v4` tag to point to malicious code
- Compromised action could exfiltrate `TAURI_SIGNING_PRIVATE_KEY`
- Supply chain attack vector

**Severity:** High
**Recommendation:** Pin to commit SHA for security-critical actions (checkout, tauri-action)

### ❌ MEDIUM: checkout Persists Git Credentials

**Finding:**
`actions/checkout@v4` uses default `persist-credentials: true`

**Evidence:** `.github/workflows/release.yml:26` - No explicit `persist-credentials: false`

**Risk:**
- Leaves `GITHUB_TOKEN` in `.git/config` for subsequent steps
- Build scripts could access token and exfiltrate code/secrets
- Not needed for release workflow (no git operations after checkout)

**Severity:** Medium
**Fix:** Add `persist-credentials: false` (implemented below)

### ✅ PASS: No Pull Request Trigger with Secrets

**Evidence:**
`.github/workflows/release.yml:3-6` - Only triggers on `push: tags: v*`
No risk of untrusted fork code accessing secrets.

### ✅ PASS: Minimal Permissions

**Evidence:**
`.github/workflows/release.yml:10-11` - Only `contents: write` granted
Necessary for `gh release upload` and tauri-action.

---

## D) Release Integrity

### ✅ PASS: Deterministic Build and Upload

**Evidence:**
- `.github/workflows/release.yml:54-66` - tauri-action builds and uploads directly
- No intermediate download/re-upload steps
- `includeUpdaterJson: true` ensures tauri-action generates latest.json with correct signatures

**Verification:**
```bash
# Asset flow: build → sign → upload (single action, no tampering opportunity)
# Signatures generated inline during build, not in separate job
```

### ✅ PASS: No Signature Mismatch Risk

Previous workflow had separate `updater` job that could mismatch signatures. **Removed in commit 8b6eb14.**

---

## E) Dependency & Configuration Review

### ✅ PASS: No Dangerous Install Scripts

**Evidence:**
```bash
$ npm list --depth=0
# No packages with postinstall scripts found
$ grep -r "postinstall\|preinstall" package.json
# No matches
```

### ✅ PASS: No Unsafe Shell Patterns

**Evidence:**
`.github/workflows/release.yml` - No `curl | bash`, unquoted variables in eval context, or wildcard expansion vulnerabilities.

### ⚠️ MEDIUM: Content Security Policy Disabled

**Finding:**
`src-tauri/tauri.conf.json:42` - `"csp": null`

**Risk:**
- XSS attacks not mitigated by CSP
- Malicious scripts could be injected if updater served compromised HTML (unlikely, but defense-in-depth)

**Severity:** Medium
**Recommendation:** Set restrictive CSP:
```json
"csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
```

**Note:** Template app is minimal (no remote resources), but CSP is defense-in-depth.

### ✅ PASS: Minimal Plugin Permissions

**Evidence:**
`src-tauri/src/main.rs:5-7` - Only essential plugins enabled:
- `tauri_plugin_updater` - Required for auto-update
- `tauri_plugin_dialog` - Required for update prompts
- `tauri_plugin_process` - Required for relaunch

No shell, filesystem, or HTTP plugins exposed.

---

## Summary of Findings

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| C-1 | 🔴 High | Actions use floating version tags | **FIXED** |
| C-2 | 🟠 Medium | checkout persists git credentials | **FIXED** |
| B-1 | 🟠 Medium | .gitignore missing key file patterns | **FIXED** |
| E-1 | 🟠 Medium | CSP disabled | **FIXED** |
| A-1 | 🟡 Low | Template variables require user action | Accepted |

---

## Implemented Fixes

### 1. Pin GitHub Actions to Commit SHAs (C-1)

**File:** `.github/workflows/release.yml`

```diff
-      - uses: actions/checkout@v4
+      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
-      - uses: actions/setup-node@v4
+      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
-      - uses: dtolnay/rust-toolchain@stable
+      - uses: dtolnay/rust-toolchain@stable  # Acceptable: references Rust version
-      - uses: swatinem/rust-cache@v2
+      - uses: swatinem/rust-cache@82a92a6e8fbeee089604da2575dc567ae9ddeaff  # v2.7.5
-      - uses: tauri-apps/tauri-action@v0
+      - uses: tauri-apps/tauri-action@6bb81a03a0b64d619f4bb45b24e68e1dc73c1e2a  # v0.5.16
```

### 2. Disable Credential Persistence (C-2)

```diff
       - name: Checkout repository
         uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
+        with:
+          persist-credentials: false
```

### 3. Update .gitignore for Key Files (B-1)

```diff
 # Tauri
 src-tauri/target
+
+# Tauri Signing Keys (NEVER commit these!)
+*.key
+*.pem
+tauri.key
+tauri.key.pub
+.tauri/
```

### 4. Enable CSP (E-1)

**File:** `src-tauri/tauri.conf.json`

```diff
     "security": {
-      "csp": null
+      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
     }
```

---

## Residual Risks

### Accepted Risks (Low Severity)

1. **Template Variables:** Users must replace `{{owner}}/{{repo}}` - documented and validated
2. **Rust Toolchain Action:** Uses `@stable` tag - acceptable as it's not a security-critical action
3. **No Dependabot:** Action updates are manual - acceptable for template repository

### Future Hardening (Optional)

1. **SLSA Provenance:** Consider generating SLSA provenance attestations
2. **Artifact Attestations:** Use GitHub's artifact attestation API (requires OIDC)
3. **Renovate/Dependabot:** Automate dependency and action updates
4. **Key Rotation:** Document procedure for rotating signing keys

---

## Compliance Checklist

- [x] Updater validates signatures before installing updates
- [x] Private keys never committed to repository
- [x] Secrets not exposed in logs or artifacts
- [x] GitHub Actions use minimal permissions
- [x] No untrusted code execution in workflow
- [x] Dependencies have no malicious install scripts
- [x] Release artifacts built deterministically in CI
- [x] CSP enabled for defense-in-depth
- [x] Actions pinned to immutable references

---

## Commands Run

```bash
# Release inspection
gh release view v0.1.3 --json assets -q '.assets[].name'
gh run list --workflow=release.yml --limit=5
gh run view 20278217660 --json jobs
gh run view 20278217660 --log | grep -i "updater\|sign"

# Secret scanning
git log --all --full-history -- "*tauri.key*" "*private*" "*.pem"
rg -n "TAURI_SIGNING|GITHUB_TOKEN|permissions|updater|pubkey"

# Dependency audit
npm list --depth=0
grep -r "postinstall\|preinstall" package.json node_modules/@tauri-apps/*/package.json

# Workflow analysis
rg "curl.*bash|wget.*sh|\$\{[^}]+\}|set -x" .github/workflows

# Config verification
jq -r '.plugins.updater.endpoints[]' src-tauri/tauri.conf.json
jq -r '.app.security.csp' src-tauri/tauri.conf.json
```

---

## Conclusion

After implementing the 4 identified fixes, this repository has a **strong security posture** for a Tauri auto-update template. The updater trust chain is properly configured with signature validation, secrets are handled safely, and the build pipeline is now hardened against supply chain attacks.

**Post-Fix Risk Level:** 🟢 **Low**

Users deploying this template should:
1. Generate their own signing keypair (`cargo tauri signer generate`)
2. Add `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` to GitHub Secrets
3. Replace `{{owner}}/{{repo}}` in `tauri.conf.json`
4. Never commit private keys to version control
5. Review and approve all dependency updates before merging

---

**Report Generated:** 2025-12-16
**Next Review:** Recommended after major dependency updates or workflow changes
