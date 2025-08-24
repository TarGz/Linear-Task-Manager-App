#!/usr/bin/env node

// Script to sync version between constants.js and package.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '../package.json');
const constantsPath = path.join(__dirname, '../src/config/constants.js');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageVersion = packageJson.version;

// Read constants.js
let constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Update version in constants.js
const updatedConstants = constantsContent.replace(
  /export const APP_VERSION = '[^']+';/,
  `export const APP_VERSION = '${packageVersion}';`
);

// Write back constants.js
fs.writeFileSync(constantsPath, updatedConstants);

console.log(`✅ Synced version ${packageVersion} from package.json to constants.js`);