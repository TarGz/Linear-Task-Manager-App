# Deployment Process

## ⚠️ CRITICAL: GitHub Pages Auto-Deploy

The parent repository (Linear-Task-Manager-App) has GitHub Pages configured to **automatically deploy on EVERY push to main branch**.

## Deployment Rules

### ✅ ONLY use the automated script:
```bash
npm run release-deploy
```

### ❌ NEVER do manual commits/pushes:
- Manual commits trigger unwanted deployments
- Each commit = 1 deployment
- Multiple commits = Multiple deployments

## What the Script Does

1. **Version Bump Commit**: Updates version in all files + any pending changes
2. **Deploy Commit**: Updates parent directory with built files

**Total: 2 commits = 2 deployments (expected)**

## Troubleshooting

- **Multiple deployments?** Check if you made manual commits
- **Version mismatch?** Use the script, don't edit versions manually
- **Build errors?** Script handles retries automatically

## Never Do

- Manual `git commit` and `git push`
- Direct editing of version numbers
- Separate commits for small fixes

Always bundle changes and use the release script.