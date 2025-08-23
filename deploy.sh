#!/bin/bash

# Deploy script for Linear Task Manager App
# This script builds the app and copies files to root for GitHub Pages

echo "🚀 Starting deployment process..."

# Navigate to linear-pwa directory
cd linear-pwa

# Build the app
echo "📦 Building the app..."
npm run build

# Copy built files to root directory for GitHub Pages
echo "📋 Copying files to root..."
cp -r dist/* ../

# Go back to root directory
cd ..

# Add, commit and push
echo "📤 Committing and pushing to GitHub..."
git add -A
git commit -m "Deploy to GitHub Pages"
git push origin main

echo "✅ Deployment complete! The site will update in a few minutes."
echo "🔗 Visit: https://targz.github.io/Linear-Task-Manager-App/"