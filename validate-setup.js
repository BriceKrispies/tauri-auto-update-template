#!/usr/bin/env node

/**
 * Setup Validation Script
 * Checks if the Tauri auto-update template is configured correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errors = [];
const warnings = [];
const info = [];

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath} (${description})`);
    return null;
  }
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    errors.push(`Cannot read ${filePath}: ${e.message}`);
    return null;
  }
}

function checkJSON(filePath, description) {
  const content = checkFile(filePath, description);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (e) {
    errors.push(`Invalid JSON in ${filePath}: ${e.message}`);
    return null;
  }
}

console.log('🔍 Validating Tauri Auto-Update Setup...\n');

// Check tauri.conf.json
const tauriConf = checkJSON(
  path.join(__dirname, 'src-tauri', 'tauri.conf.json'),
  'Tauri configuration'
);

if (tauriConf) {
  // Check updater config
  if (!tauriConf.plugins?.updater) {
    errors.push('Updater plugin not configured in tauri.conf.json');
  } else {
    const updater = tauriConf.plugins.updater;

    if (!updater.active) {
      warnings.push('Updater is not active');
    }

    if (!updater.pubkey || updater.pubkey === 'UPDATER_PUBLIC_KEY_PLACEHOLDER') {
      errors.push('Public key not set in tauri.conf.json - see README for setup instructions');
    } else {
      info.push('✓ Public key is configured');
    }

    if (!updater.endpoints || updater.endpoints.length === 0) {
      errors.push('No updater endpoints configured');
    } else {
      const endpoint = updater.endpoints[0];
      if (endpoint.includes('{{owner}}') || endpoint.includes('{{repo}}')) {
        warnings.push('Endpoint uses template variables - ensure these are replaced with actual values or your GitHub Actions are configured correctly');
      } else if (endpoint.includes('github.com')) {
        const match = endpoint.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          info.push(`✓ Updater endpoint: ${match[1]}/${match[2]}`);
        }
      }
    }
  }

  // Check identifier
  if (tauriConf.identifier === 'com.example.tauriautoupdate') {
    warnings.push('App identifier is still the default - update it to your unique identifier (e.g., com.yourcompany.yourapp)');
  } else {
    info.push(`✓ App identifier: ${tauriConf.identifier}`);
  }

  // Check product name
  if (tauriConf.productName === 'tauri-auto-update-app') {
    warnings.push('Product name is still the default - update it to your app name');
  } else {
    info.push(`✓ Product name: ${tauriConf.productName}`);
  }
}

// Check Cargo.toml
const cargoToml = checkFile(
  path.join(__dirname, 'src-tauri', 'Cargo.toml'),
  'Cargo manifest'
);

if (cargoToml) {
  const versionMatch = cargoToml.match(/version\s*=\s*"([^"]+)"/);
  if (versionMatch) {
    info.push(`✓ Current version: ${versionMatch[1]}`);
  } else {
    warnings.push('Could not parse version from Cargo.toml');
  }

  if (cargoToml.includes('name = "tauri-auto-update-app"')) {
    warnings.push('Package name is still the default in Cargo.toml');
  }

  if (cargoToml.includes('authors = ["you"]')) {
    warnings.push('Package authors is still the default in Cargo.toml');
  }
}

// Check main.rs
const mainRs = checkFile(
  path.join(__dirname, 'src-tauri', 'src', 'main.rs'),
  'Rust main file'
);

if (mainRs) {
  if (!mainRs.includes('tauri_plugin_updater')) {
    errors.push('Updater plugin not registered in main.rs');
  } else {
    info.push('✓ Updater plugin registered');
  }
}

// Check package.json
const packageJson = checkJSON(
  path.join(__dirname, 'package.json'),
  'Package configuration'
);

if (packageJson) {
  const requiredDeps = [
    '@tauri-apps/api',
    '@tauri-apps/plugin-updater',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/plugin-process'
  ];

  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
  if (missingDeps.length > 0) {
    errors.push(`Missing dependencies: ${missingDeps.join(', ')} - run npm install`);
  } else {
    info.push('✓ All required dependencies present');
  }
}

// Check icons
const iconFiles = [
  'src-tauri/icons/icon.ico',
  'src-tauri/icons/icon.icns',
  'src-tauri/icons/128x128.png'
];

let missingIcons = 0;
for (const iconFile of iconFiles) {
  if (!fs.existsSync(path.join(__dirname, iconFile))) {
    missingIcons++;
  }
}

if (missingIcons > 0) {
  warnings.push(`${missingIcons} icon file(s) missing - run: npm run tauri:icon <source-image>`);
} else {
  info.push('✓ Icon files present');
}

// Check GitHub Actions workflow
const workflowPath = path.join(__dirname, '.github', 'workflows', 'release.yml');
if (fs.existsSync(workflowPath)) {
  info.push('✓ GitHub Actions workflow configured');
} else {
  errors.push('GitHub Actions workflow missing');
}

// Check for .git directory
if (!fs.existsSync(path.join(__dirname, '.git'))) {
  warnings.push('Not a git repository - run: git init');
}

// Output results
console.log('\n📋 Validation Results:\n');

if (info.length > 0) {
  console.log('✅ Passed checks:');
  info.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(msg => console.log(`   - ${msg}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors (must fix before releasing):');
  errors.forEach(msg => console.log(`   - ${msg}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! You\'re ready to build and release.\n');
  console.log('Next steps:');
  console.log('  1. Test locally: npm run tauri:build');
  console.log('  2. Create a release: git tag v0.1.0 && git push --tags');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('✅ No critical errors, but please review warnings.\n');
  process.exit(0);
} else {
  console.log('❌ Please fix the errors above before proceeding.\n');
  console.log('See README.md and SETUP.md for detailed instructions.\n');
  process.exit(1);
}
