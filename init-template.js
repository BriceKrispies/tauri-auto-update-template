#!/usr/bin/env node

/**
 * Template Initialization Script
 * Automates setup of a new Tauri auto-update app from this template
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
  } catch (error) {
    return null;
  }
}

console.log('🚀 Tauri Auto-Update Template Initializer\n');

async function main() {
  // Step 1: Detect GitHub repo
  console.log('📡 Step 1: Detecting GitHub repository...');

  const gitRemote = exec('git remote get-url origin');
  if (!gitRemote) {
    console.error('❌ Error: Not a git repository or no origin remote found.');
    console.error('   Please initialize git and add a remote first:');
    console.error('   git init');
    console.error('   git remote add origin https://github.com/owner/repo.git\n');
    process.exit(1);
  }

  // Parse owner/repo from remote URL
  let owner, repo;
  const httpsMatch = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
  if (httpsMatch) {
    owner = httpsMatch[1];
    repo = httpsMatch[2];
  } else {
    console.error('❌ Error: Could not parse GitHub repository from remote URL.');
    console.error(`   Remote URL: ${gitRemote}`);
    console.error('   Expected format: https://github.com/owner/repo.git or git@github.com:owner/repo.git\n');
    process.exit(1);
  }

  console.log(`✓ Detected repository: ${owner}/${repo}\n`);

  // Step 2: Confirm with user
  const confirm = await question(`Continue with repository "${owner}/${repo}"? (y/n): `);
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('Initialization cancelled.');
    process.exit(0);
  }

  // Step 3: Generate keypair
  console.log('\n🔐 Step 2: Generating updater signing keypair...');

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const keyDir = path.join(homeDir, '.tauri');
  const keyPath = path.join(keyDir, `${repo}.key`);

  // Create .tauri directory if it doesn't exist
  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }

  // Check if key already exists
  if (fs.existsSync(keyPath)) {
    console.log(`⚠️  Key already exists at: ${keyPath}`);
    const overwrite = await question('   Overwrite existing key? (y/n): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('   Using existing key...');
    } else {
      fs.unlinkSync(keyPath);
      if (fs.existsSync(keyPath + '.pub')) {
        fs.unlinkSync(keyPath + '.pub');
      }
    }
  }

  // Generate keypair if it doesn't exist
  if (!fs.existsSync(keyPath)) {
    console.log('   Generating keypair (no password - press Enter when prompted)...');
    try {
      execSync(`npm run tauri signer generate -- -w "${keyPath}"`, {
        stdio: 'inherit',
        shell: true
      });
    } catch (error) {
      console.error('❌ Error generating keypair');
      process.exit(1);
    }
  }

  // Read the generated public key
  const pubKeyPath = keyPath + '.pub';
  if (!fs.existsSync(pubKeyPath)) {
    console.error(`❌ Error: Public key not found at ${pubKeyPath}`);
    process.exit(1);
  }

  const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();
  console.log(`✓ Keypair generated at: ${keyPath}\n`);

  // Step 4: Update tauri.conf.json
  console.log('📝 Step 3: Updating tauri.conf.json...');

  const tauriConfPath = path.join(__dirname, 'src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

  // Update endpoint
  tauriConf.plugins.updater.endpoints = [
    `https://github.com/${owner}/${repo}/releases/latest/download/latest.json`
  ];

  // Update pubkey
  tauriConf.plugins.updater.pubkey = pubKey;

  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
  console.log('✓ Updated updater endpoint and public key\n');

  // Step 5: Optionally update metadata
  console.log('📝 Step 4: Customizing app metadata...');

  const appName = await question(`App name (default: ${repo}): `) || repo;
  const appId = await question(`App identifier (default: com.${owner}.${repo}): `) || `com.${owner}.${repo}`;

  // Update tauri.conf.json with app metadata
  tauriConf.productName = appName;
  tauriConf.identifier = appId;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

  // Update package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = repo.toLowerCase();
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  // Update Cargo.toml
  const cargoTomlPath = path.join(__dirname, 'src-tauri', 'Cargo.toml');
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(/name = ".*?"/, `name = "${repo.toLowerCase()}"`);
  cargoToml = cargoToml.replace(/description = ".*?"/, `description = "${appName}"`);
  fs.writeFileSync(cargoTomlPath, cargoToml);

  console.log('✓ Updated app metadata\n');

  // Step 6: Display next steps
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Initialization Complete!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📋 NEXT STEPS:\n');

  console.log('1️⃣  Add GitHub Secret: TAURI_SIGNING_PRIVATE_KEY');
  console.log('   Go to: https://github.com/' + owner + '/' + repo + '/settings/secrets/actions/new');
  console.log('   Name: TAURI_SIGNING_PRIVATE_KEY');
  console.log('   Value: Copy the ENTIRE content below:\n');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  privateKey.split('\n').forEach(line => {
    console.log('   │ ' + line.padEnd(55) + ' │');
  });
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('2️⃣  Test the setup:');
  console.log('   npm run validate\n');

  console.log('3️⃣  Build and test locally:');
  console.log('   npm run tauri:build\n');

  console.log('4️⃣  Create your first release:');
  console.log('   git add .');
  console.log('   git commit -m "Initial setup"');
  console.log('   git tag v0.1.0');
  console.log('   git push origin main --tags\n');

  console.log('5️⃣  Monitor the GitHub Actions workflow:');
  console.log('   https://github.com/' + owner + '/' + repo + '/actions\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
