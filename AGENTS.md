# Repository Guidelines

## Project Structure & Module Organization
- Root: production build output, PWA assets, GitHub Pages workflow, docs in `doc/`.
- App source: `linear-pwa/src` (pages, components, services, hooks, utils, config).
- Scripts: `linear-pwa/scripts` for release/deploy automation.
- CI: `.github/workflows/deploy.yml` deploys the root to GitHub Pages.
- API smoke test: `test-linear-api.js` (uses `.env`); example in `.env.example`.

## Build, Test, and Development Commands
- Dev server: `cd linear-pwa && npm install && npm run dev` (Vite).
- Build: `cd linear-pwa && npm run build` → outputs to `linear-pwa/dist`.
- Preview build: `cd linear-pwa && npm run preview`.
- Lint: `cd linear-pwa && npm run lint` (ESLint config in `eslint.config.js`).
- API test: from repo root `npm run test-api` (requires `LINEAR_API_KEY` in `.env`).
- Release/deploy: `cd linear-pwa && npm run release` or `npm run release-deploy` (bumps version, builds, copies `dist/*` to repo root, commits, and pushes/deploys).

## Coding Style & Naming Conventions
- Language: React (JSX), ES Modules, 2-space indentation.
- Components: PascalCase files in `src/components` and `src/pages` (e.g., `ProjectCard.jsx`).
- Hooks: `useXyz.js` in `src/hooks` (e.g., `useSwipeActions.js`).
- Utilities: camelCase in `src/utils` (e.g., `dateUtils.js`).
- Styles: co-located `.css` files matching component names.
- Linting: ESLint recommended + React Hooks/Refresh; constants in ALL_CAPS allowed (`no-unused-vars` ignores `^[A-Z_]`).

## Testing Guidelines
- Current: API connectivity test via `npm run test-api`.
- Unit/UI tests are not yet configured. When adding tests, co-locate as `*.test.jsx` near components/services and favor React Testing Library + Vitest.
- Keep tests minimal but cover services (`src/services/*`) and page flows.

## Commit & Pull Request Guidelines
- Commits: follow existing style, e.g., `v3.1.2: Bug fixes and improvements` and `Deploy v3.1.2 to GitHub Pages`. Use clear, imperative titles; include context in body when needed.
- PRs: include a concise description, linked issues, screenshots/GIFs for UI changes, and a quick test plan. Reference affected paths (e.g., `linear-pwa/src/pages/…`).
- Releases: prefer `linear-pwa/scripts/release*.js` to bump versions and deploy to avoid extra deploy commits.

## Security & Configuration Tips
- Do not commit secrets. Copy `.env.example` → `.env`; set `LINEAR_API_KEY` for API tests.
- The app stores the Linear API key in `localStorage` via Settings; do not hardcode keys.
- Review network calls in `linear-pwa/src/services/linearApi.js` when changing auth or scopes.

