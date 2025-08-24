#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function getCurrentFeatures() {
  const constantsPath = 'src/config/constants.js';
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  const match = constantsContent.match(/export const APP_FEATURES = '([^']+)'/);
  return match ? match[1] : 'Unknown features';
}

function bumpVersion(currentVersion, type = 'patch') {
  const parts = currentVersion.split('.').map(n => parseInt(n));
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
}

function updateConstantsVersion(newVersion) {
  const constantsPath = 'src/config/constants.js';
  let constantsContent = fs.readFileSync(constantsPath, 'utf8');
  
  constantsContent = constantsContent.replace(
    /export const APP_VERSION = '[^']+'/,
    `export const APP_VERSION = '${newVersion}'`
  );
  
  fs.writeFileSync(constantsPath, constantsContent);
}

function updateIndexHtmlVersion(newVersion) {
  const indexPath = 'index.html';
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Update version meta tag
  indexContent = indexContent.replace(
    /<meta name="app-version" content="[^"]+" \/>/,
    `<meta name="app-version" content="${newVersion}" />`
  );
  
  // Update timestamp
  const timestamp = new Date().toISOString();
  indexContent = indexContent.replace(
    /<meta name="build-timestamp" content="[^"]+" \/>/,
    `<meta name="build-timestamp" content="${timestamp}" />`
  );
  
  fs.writeFileSync(indexPath, indexContent);
}

function generateCommitMessage(version, features, commitType) {
  let title;
  switch (commitType) {
    case 'major':
      title = `v${version}: Major release with breaking changes`;
      break;
    case 'minor':
      title = `v${version}: New features and enhancements`;
      break;
    case 'patch':
    default:
      title = `v${version}: Bug fixes and improvements`;
      break;
  }
  
  return `${title}

Features: ${features}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const commitType = args[1] || versionType;
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    log('red', 'Error: Version type must be major, minor, or patch');
    process.exit(1);
  }
  
  log('blue', '🚀 Starting release AND deploy process...\n');
  
  // Get current state
  const currentVersion = getCurrentVersion();
  const currentFeatures = getCurrentFeatures();
  
  // Calculate new version
  const newVersion = bumpVersion(currentVersion, versionType);
  
  log('green', `📦 Current version: ${currentVersion}`);
  log('green', `📦 New version: ${newVersion}`);
  log('cyan', `✨ Features: ${currentFeatures}\n`);
  
  // Update version in files
  log('yellow', '🔄 Updating version in package.json, constants.js, and index.html...');
  updatePackageVersion(newVersion);
  updateConstantsVersion(newVersion);
  updateIndexHtmlVersion(newVersion);
  
  // Stage and commit
  log('yellow', '📝 Staging changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  const commitMessage = generateCommitMessage(newVersion, currentFeatures, commitType);
  
  log('yellow', '💾 Creating commit...');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  
  log('yellow', '📤 Pushing to GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  // Now deploy
  log('blue', '\n🌐 Starting deployment process...');
  
  log('yellow', '📦 Building the app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  log('yellow', '📋 Copying files to parent directory...');
  execSync('cp -r dist/* ../', { stdio: 'inherit' });
  
  log('yellow', '📤 Deploying to GitHub Pages...');
  process.chdir('..');
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "Deploy v${newVersion} to GitHub Pages"`, { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  
  log('green', '\n✅ Release AND deployment complete!');
  log('cyan', `🔗 Live site will update in a few minutes`);
  log('cyan', `📱 Version ${newVersion} is now deployed`);
  log('magenta', `🎯 No more manual steps needed!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}