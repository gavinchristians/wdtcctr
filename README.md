# chicken-3d

A 3D rebuild of _Why did the chicken cross the road?_, originally a 2D jQuery
game (preserved in `../Why did the chicken cross the road/`). This rebuild
targets a polished, Crossy-Road-style web experience.

> Phase 0 (scaffold) only. The scene currently shows a green ground plane lit
> by a sun under fog. Gameplay arrives in Phase 1+.

## Stack

- **Vite 5** + **React 18** + **TypeScript 5** (strict)
- **three.js** via **@react-three/fiber** + **@react-three/drei**
- **zustand** for game state (added now to avoid retrofitting later)
- **ESLint** (flat config) + **Prettier** + **EditorConfig**
- **Husky** + **lint-staged** pre-commit hook
- **Vitest** for unit tests, **Playwright** for end-to-end
- **GitHub Actions** for CI, **Cloudflare Pages** for preview/production deploys

Node version is pinned via `.nvmrc` to Node 20 LTS.

## Getting started

```bash
cd chicken-3d
nvm use         # optional, picks up .nvmrc
npm install
npm run dev     # http://localhost:5173
```

## Scripts

| Command                    | What it does                                   |
| -------------------------- | ---------------------------------------------- |
| `npm run dev`              | Start the Vite dev server                      |
| `npm run build`            | Typecheck and produce a production build       |
| `npm run preview`          | Serve the built output on `localhost:4173`     |
| `npm run typecheck`        | Run `tsc --noEmit` over the project references |
| `npm run lint`             | Run ESLint over the repo                       |
| `npm run lint:fix`         | Run ESLint with `--fix`                        |
| `npm run format`           | Format the repo with Prettier                  |
| `npm run format:check`     | Check formatting without writing               |
| `npm run test`             | Run Vitest unit tests once                     |
| `npm run test:watch`       | Run Vitest in watch mode                       |
| `npm run test:e2e`         | Run Playwright end-to-end tests                |
| `npm run test:e2e:install` | Install the Chromium browser for Playwright    |

## Project layout

```text
chicken-3d/
  public/                  Static assets served as-is (currently empty)
  src/
    main.tsx               React entry point, mounts <App />
    App.tsx                Root component
    index.css              Global page-level styles
    ui/
      AppShell.tsx         Wraps the game canvas; future home of menus/HUD
    game/
      Scene.tsx            R3F <Canvas> + ortho camera + lights + ground
      math.ts              Tiny pure helpers (snapToTile, clamp)
  tests/
    unit/
      smoke.test.ts        Vitest smoke test for math helpers
  e2e/
    smoke.spec.ts          Playwright smoke test (canvas renders)
  .husky/                  Git hooks (pre-commit runs lint-staged)
  eslint.config.js         ESLint flat config
  .prettierrc              Prettier config
  .editorconfig            Cross-editor whitespace rules
  .nvmrc                   Pinned Node version
  vite.config.ts           Vite + @vitejs/plugin-react
  vitest.config.ts         Vitest (jsdom env)
  playwright.config.ts     Playwright (chromium, vite preview as web server)
  tsconfig*.json           TypeScript project references (strict)
```

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. **quality** - `format:check`, `lint`, `typecheck`, `test`, `build`
2. **e2e** - installs Playwright Chromium, builds, runs e2e tests
3. **deploy** - deploys to Cloudflare Pages (if secrets are configured)

The deploy job is a no-op until the secrets below are added; the rest of CI
still runs.

## Cloudflare Pages deploy setup

Once, after merging Phase 0:

1. Create a Cloudflare account (or reuse one) and create a Pages project named
   `chicken-3d` (Direct Upload, no Git integration - GitHub Actions pushes the
   built `dist/` to it).
2. Create an API token with **Account / Cloudflare Pages / Edit** permission
   at <https://dash.cloudflare.com/profile/api-tokens>.
3. In the GitHub repo, add two secrets under
   **Settings -> Secrets and variables -> Actions**:
   - `CLOUDFLARE_API_TOKEN` - the token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` - shown in the Cloudflare dashboard URL or under
     **Workers & Pages -> Overview**

After that, every PR gets a Cloudflare-hosted preview URL and merges to `main`
deploy to production. Until those secrets exist, the deploy job logs a notice
and skips.

## What Phase 0 intentionally leaves out

- No game logic, input handling, or chicken character.
- No port of the original 2D `assets/js/site.js`.
- No physics engine (rapier), audio (howler), PWA, or Supabase backend - those
  arrive in later phases per the [plan](../README.md#chicken-3d).

## Contributing

- Run `npm run format` and `npm run lint:fix` before pushing.
- The pre-commit hook (Husky + lint-staged) enforces this automatically.
- Keep PRs small and tied to a single phase task.
