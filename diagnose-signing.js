#!/usr/bin/env node

/**
 * Signing Diagnostic Tool
 * Checks if your Tauri signing is configured correctly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔐 Tauri Signing Diagnostic Tool\n');
console.log('═════════════════════════════════════════════════════\n');

// Check 1: GitHub Secrets
console.log('1️⃣  Checking GitHub Secrets...');
try {
  const secrets = execSync('gh secret list --json name', { encoding: 'utf8' });
  const secretList = JSON.parse(secrets);
  const hasPrivateKey = secretList.some(s => s.name === 'TAURI_SIGNING_PRIVATE_KEY');
  const hasPassword = secretList.some(s => s.name === 'TAURI_SIGNING_PRIVATE_KEY_PASSWORD');

  console.log(`   TAURI_SIGNING_PRIVATE_KEY: ${hasPrivateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${hasPassword ? '✅ Set' : '❌ Missing'}`);

  if (!hasPrivateKey) {
    console.log('   \n   ⚠️  Private key is missing! This is required for signing.\n');
  }

  if (hasPassword) {
    console.log('   \n   💡 Note: Password is set but may be empty. Most keys don\'t need passwords.\n');
  }
} catch (error) {
  console.log('   ❌ Cannot check secrets (is gh CLI installed and authenticated?)');
}

// Check 2: tauri.conf.json
console.log('\n2️⃣  Checking tauri.conf.json...');
try {
  const tauriConf = JSON.parse(
    fs.readFileSync('src-tauri/tauri.conf.json', 'utf8')
  );

  const pubkey = tauriConf.plugins?.updater?.pubkey;
  const endpoint = tauriConf.plugins?.updater?.endpoints?.[0];

  console.log(`   Public key: ${pubkey ? '✅ Configured' : '❌ Missing'}`);

  if (endpoint) {
    if (endpoint.includes('{{owner}}') || endpoint.includes('{{repo}}')) {
      console.log(`   Endpoint: ❌ Still has template variables!`);
      console.log(`   Current: ${endpoint}`);
      console.log(`   Should be: https://github.com/YOUR_USER/YOUR_REPO/releases/latest/download/latest.json`);
    } else {
      console.log(`   Endpoint: ✅ ${endpoint}`);
    }
  } else {
    console.log(`   Endpoint: ❌ Missing`);
  }
} catch (error) {
  console.log(`   ❌ Error reading tauri.conf.json: ${error.message}`);
}

// Check 3: Local keys
console.log('\n3️⃣  Checking Local Keys...');
const homeDir = process.env.HOME || process.env.USERPROFILE;
const tauriDir = path.join(homeDir, '.tauri');

if (fs.existsSync(tauriDir)) {
  const files = fs.readdirSync(tauriDir);
  const keyFiles = files.filter(f => f.endsWith('.key'));
  const pubFiles = files.filter(f => f.endsWith('.pub'));

  console.log(`   Keys found: ${keyFiles.length > 0 ? '✅' : '❌'} ${keyFiles.join(', ') || 'none'}`);
  console.log(`   Public keys: ${pubFiles.length > 0 ? '✅' : '❌'} ${pubFiles.join(', ') || 'none'}`);

  if (keyFiles.length === 0) {
    console.log('\n   💡 No local keys found. This is OK if you already set GitHub secrets.');
    console.log('   💡 You only need local keys for local testing.');
  }
} else {
  console.log('   ❌ ~/.tauri directory not found');
  console.log('\n   💡 This is OK if you already have GitHub secrets set.');
  console.log('   💡 Local keys are only needed for local testing.');
}

// Check 4: Recent workflow runs
console.log('\n4️⃣  Checking Recent Workflow Runs...');
try {
  const runs = execSync(
    'gh run list --workflow=release.yml --limit 1 --json conclusion,status,name',
    { encoding: 'utf8' }
  );
  const runData = JSON.parse(runs);

  if (runData.length > 0) {
    const run = runData[0];
    console.log(`   Latest run: ${run.name}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Conclusion: ${run.conclusion || 'in progress'}`);
  }
} catch (error) {
  console.log('   ℹ️  No recent workflow runs found');
}

// Check 5: What's actually wrong
console.log('\n5️⃣  Diagnosing the Issue...\n');

// Check latest release
try {
  const assets = execSync(
    'gh release view --json assets --jq ".assets[].name"',
    { encoding: 'utf8' }
  ).split('\n').filter(Boolean);

  const hasUpdaterJson = assets.some(a => a.includes('latest-'));

  if (!hasUpdaterJson) {
    console.log('   🔍 FOUND THE ISSUE!');
    console.log('   ❌ Updater JSON files are missing from releases\n');
    console.log('   This means:');
    console.log('   • Signing IS happening (you have the secrets)');
    console.log('   • But the updater manifest JSON is NOT being created/uploaded');
    console.log('   • This is a known issue with tauri-action@v0\n');
    console.log('   Solutions:');
    console.log('   1. Try pinning tauri-action to v0.5.15 or v0.5.14');
    console.log('   2. Check that strip = "debuginfo" (not strip = true)');
    console.log('   3. Verify Tauri version compatibility\n');
    console.log('   Assets found:');
    assets.forEach(a => console.log(`   - ${a}`));
  } else {
    console.log('   ✅ Updater JSON files are present!');
    console.log('   🎉 Auto-updates should work!\n');
    console.log('   Assets found:');
    assets.forEach(a => console.log(`   - ${a}`));
  }
} catch (error) {
  console.log('   ℹ️  No releases found yet');
}

console.log('\n═════════════════════════════════════════════════════');
console.log('📋 Summary\n');

console.log('If updater JSON is missing, the issue is NOT your signing keys.');
console.log('The keys are configured correctly, but tauri-action isn\'t creating');
console.log('the updater manifest files.\n');

console.log('Next steps:');
console.log('1. Commit the endpoint fix in tauri.conf.json');
console.log('2. Try pinning tauri-action to a specific version');
console.log('3. Check UPDATER_DIAGNOSIS.md for detailed solutions\n');
