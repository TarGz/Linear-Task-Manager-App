# Release Process

A concise, reliable way to cut and ship releases for this repo.

## Prerequisites
- Git push access to `origin main` and a clean working tree.
- GitHub CLI authenticated: `gh auth login`.
- Node dependencies installed in `linear-pwa`: `cd linear-pwa && npm ci` (first time).

## Quick Path (recommended)
- Patch release + deploy: from repo root
  - `npm run release-deploy`
- Minor/Major:
  - `npm run release-deploy:minor` or `npm run release-deploy:major`

What it does
- Bumps version in `linear-pwa/package.json` and syncs `src/config/constants.js` (and updates `index.html` meta + `README.md`).
- Builds with Vite and copies `linear-pwa/dist/*` to repo root.
- Commits “Deploy vX.Y.Z to GitHub Pages”, pushes to `main`.
- Triggers Pages workflow and creates a GitHub release via `gh`.

## Release Only (no deploy)
- Patch: `npm run release`
- Minor/Major: `npm run release:minor` or `npm run release:major`
- Push manually if desired: `git push`

## Post-Checks
- GitHub Actions: verify “Deploy to GitHub Pages” run is green.
- Site: refresh after a few minutes to see latest build.
- Release: confirm tag `vX.Y.Z` exists in GitHub Releases.

## Tips
- Avoid extra commits between release and deploy to prevent multiple auto-deploys.
- Never commit secrets; `.env` is local-only. API tests use `LINEAR_API_KEY`.
- If `gh` fails to create a release, create it manually and retry next time.
