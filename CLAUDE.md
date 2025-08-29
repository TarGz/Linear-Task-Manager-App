## Version Management & GitHub Releases

**CRITICAL**: Always use GitHub releases for version management since v3.0.0:

### Release Procedure
1. **Patch Release**: `npm run release-deploy` (auto-increments patch)
2. **Minor Release**: `npm run release-deploy:minor` (new features)  
3. **Major Release**: `npm run release-deploy:major` (breaking changes)

### Post-Release Requirements
- **GitHub releases are created automatically** by the deployment script
- The update system relies on GitHub releases API, not HTML parsing
- Release notes are auto-generated with current features
- If auto-creation fails, manually create the release (CRITICAL for updates)

### Version Consistency  
- Script automatically updates: `package.json`, `constants.js`, `index.html`, `README.md`
- **Never manually edit versions** - use the release scripts only
- Each release creates 2 commits: version bump + deployment
- **Prerequisites**: Ensure `gh` CLI is authenticated (`gh auth status`)

### Release Flow Summary
1. Run release script → 2. Version bump commit → 3. Deploy commit → 4. Auto-create GitHub release
2. App can now detect updates via GitHub Releases API

## Local iPhone Testing Setup

### Quick Development Testing
```bash
npm run dev -- --host
# Access via http://YOUR_LOCAL_IP:5173 on iPhone
```

### PWA Testing (Recommended)
```bash
npm run build && npm run preview -- --host
# Access via http://YOUR_LOCAL_IP:4173 on iPhone
# Or use ngrok for HTTPS: ngrok http 4173
```

### For Update System Testing
1. Build and serve locally with different version numbers
2. Use ngrok for HTTPS PWA testing
3. Test version detection and update flows before releasing

## CRITICAL: CSS Dev/Prod Parity Rule
ALWAYS test CSS changes in production build mode before deploying:
1. After making CSS changes, run `npm run build && npm run preview` to test production build locally
2. NEVER deploy CSS changes that only work in dev mode - dev uses direct source files, prod uses processed/minified CSS
3. CSS specificity and class names can behave differently between dev and production builds
4. If colors or styles look correct in dev but wrong in production, it's a build processing issue - fix the CSS specificity, don't just deploy hoping it works

## Deployment Rules
- **NEVER use deploy.sh** - always use npm scripts
- **Primary method**: `npm run release-deploy` for releases
- **Build only**: `npm run build` for local testing
- **Preview**: `npm run preview` to test production build locally