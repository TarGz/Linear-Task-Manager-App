- you need to update the version on the app in the settings and in the readme, and in the console log for each new feature major,minor,fix
- remeber this listake of not updating the index.html

## CRITICAL: CSS Dev/Prod Parity Rule
ALWAYS test CSS changes in production build mode before deploying:
1. After making CSS changes, run `npm run build && npm run preview` to test production build locally
2. NEVER deploy CSS changes that only work in dev mode - dev uses direct source files, prod uses processed/minified CSS
3. CSS specificity and class names can behave differently between dev and production builds
4. If colors or styles look correct in dev but wrong in production, it's a build processing issue - fix the CSS specificity, don't just deploy hoping it works