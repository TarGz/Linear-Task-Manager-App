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
  // Update linear-pwa/package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

  // Update root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  rootPackageJson.version = newVersion;
  fs.writeFileSync('../package.json', JSON.stringify(rootPackageJson, null, 2) + '\n');

  // Update root package-lock.json (metadata only, keeps version in sync)
  const rootPackageLock = JSON.parse(fs.readFileSync('../package-lock.json', 'utf8'));
  rootPackageLock.version = newVersion;
  if (rootPackageLock.packages && rootPackageLock.packages[""]) {
    rootPackageLock.packages[""].version = newVersion;
  }
  fs.writeFileSync('../package-lock.json', JSON.stringify(rootPackageLock, null, 2) + '\n');
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

function updateReadmeVersion(newVersion) {
  const readmePath = 'README.md';
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Update version in title
  readmeContent = readmeContent.replace(
    /# Linear Task Manager PWA v[0-9]+\.[0-9]+\.[0-9]+/,
    `# Linear Task Manager PWA v${newVersion}`
  );
  
  fs.writeFileSync(readmePath, readmeContent);
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

function getReleaseTitle(commitType) {
  switch (commitType) {
    case 'major':
      return 'Major Release';
    case 'minor':
      return 'New Features';
    case 'patch':
    default:
      return 'Bug Fixes & Improvements';
  }
}

function generateReleaseNotes(version, features, commitType) {
  const emoji = {
    major: '🚀',
    minor: '✨', 
    patch: '🐛'
  }[commitType] || '📦';
  
  const description = {
    major: '**Major Release** - This version includes breaking changes and significant new features.',
    minor: '**New Features** - This version adds new functionality while maintaining compatibility.',
    patch: '**Bug Fixes & Improvements** - This version includes bug fixes and minor enhancements.'
  }[commitType] || 'Release notes';

  return `${emoji} ${description}

## Current Features
${features.split(', ').map(f => `- ${f.trim()}`).join('\\n')}

---
*This release enables automatic update detection through the GitHub Releases API.*`;
}

async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const commitType = args[1] || versionType;
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    log('red', 'Error: Version type must be major, minor, or patch');
    process.exit(1);
  }
  
  log('blue', '🚀 Starting release AND deploy process...\n');
  log('yellow', '⚠️  WARNING: This will make 2 commits total (version bump + deployment)');
  log('yellow', '⚠️  Each commit triggers GitHub Pages auto-deploy from main branch');
  log('yellow', '⚠️  Use ONLY this script - no manual commits to avoid extra deploys\n');
  
  // Get current state
  const currentVersion = getCurrentVersion();
  const currentFeatures = getCurrentFeatures();
  
  // Calculate new version
  const newVersion = bumpVersion(currentVersion, versionType);
  
  log('green', `📦 Current version: ${currentVersion}`);
  log('green', `📦 New version: ${newVersion}`);
  log('cyan', `✨ Features: ${currentFeatures}\n`);
  
  // Update version in files
  log('yellow', '🔄 Updating version in all package files, constants.js, index.html, and README.md...');
  updatePackageVersion(newVersion);
  updateConstantsVersion(newVersion);
  updateIndexHtmlVersion(newVersion);
  updateReadmeVersion(newVersion);
  
  // Stage and commit ALL changes (including any other modifications)
  log('yellow', '📝 Staging ALL changes to avoid multiple commits...');
  execSync('git add -A', { stdio: 'inherit' });
  
  const commitMessage = generateCommitMessage(newVersion, currentFeatures, commitType);
  
  log('yellow', '💾 Creating commit...');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  
  log('yellow', '📤 Pushing to GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  // Small delay to ensure GitHub processes the push
  log('blue', '⏳ Waiting for GitHub to process...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Now deploy
  log('blue', '\n🌐 Starting deployment process...');
  
  log('yellow', '📦 Building the app...');
  const buildCmd = process.env.PWA_DISABLE === 'true' ? 'PWA_DISABLE=true npm run build' : 'npm run build';
  execSync(buildCmd, { stdio: 'inherit' });
  
  log('yellow', '📋 Copying files to parent directory...');
  execSync('cp -r dist/* ../', { stdio: 'inherit' });
  
  log('yellow', '📤 Deploying to GitHub Pages...');
  process.chdir('..');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Check if there are changes to commit
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
    log('yellow', 'ℹ️  No deployment changes needed.');
  } catch (diffError) {
    // There are changes to commit
    try {
      execSync(`git commit -m "Deploy v${newVersion} to GitHub Pages"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
    } catch (error) {
      log('yellow', '⚠️  First push failed, retrying in 3 seconds...');
      // Small delay and retry
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        execSync('git push origin main', { stdio: 'inherit' });
        log('green', '✅ Retry successful!');
      } catch (retryError) {
        log('red', '❌ Deploy failed after retry. You may need to push manually.');
        throw retryError;
      }
    }
  }
  
  // Trigger GitHub Pages deployment
  log('yellow', '🚀 Triggering GitHub Pages deployment...');
  try {
    execSync('gh workflow run deploy.yml', { stdio: 'inherit' });
    log('green', '✅ GitHub Pages deployment triggered!');
  } catch (workflowError) {
    log('yellow', '⚠️  Could not trigger workflow automatically');
    log('yellow', '⚠️  Please manually run: GitHub → Actions → Deploy to GitHub Pages');
  }
  
  // Create GitHub release
  log('blue', '\n📋 Creating GitHub release...');
  try {
    const releaseTitle = `v${newVersion}: ${getReleaseTitle(commitType)}`;
    const releaseNotes = generateReleaseNotes(newVersion, currentFeatures, commitType);
    
    execSync(`gh release create v${newVersion} --title "${releaseTitle}" --notes "${releaseNotes}"`, { stdio: 'inherit' });
    log('green', '✅ GitHub release created!');
  } catch (releaseError) {
    log('yellow', '⚠️  Could not create GitHub release automatically');
    log('yellow', `⚠️  Please manually create release v${newVersion} at: https://github.com/TarGz/Linear-Task-Manager-App/releases/new`);
    log('yellow', `⚠️  This is CRITICAL for the update system to work properly!`);
  }

  log('green', '\n✅ Release AND deployment complete!');
  log('cyan', `🔗 Live site will update in a few minutes`);
  log('cyan', `📱 Version ${newVersion} is now deployed`);
  log('cyan', `📋 GitHub release: https://github.com/TarGz/Linear-Task-Manager-App/releases/tag/v${newVersion}`);
  log('magenta', `🎯 Update system can now detect this version!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
