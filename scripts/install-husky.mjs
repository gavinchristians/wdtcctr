// Installs husky git hooks for local development.
// Skips silently in CI, on Cloudflare Pages/Workers, or when no .git is reachable
// (e.g. shallow clones, Docker installs, or installing from a tarball).

import { existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const SKIP_ENVS = ['CI', 'CF_PAGES', 'CLOUDFLARE_BUILD', 'VERCEL', 'NETLIFY'];
for (const key of SKIP_ENVS) {
  if (process.env[key]) {
    console.log(`[prepare] ${key} is set, skipping husky install.`);
    process.exit(0);
  }
}

// Husky needs git hooks at the repo root. The package.json lives in
// chicken-3d/, the git root lives one level up.
const repoRoot = resolve(process.cwd(), '..');
const dotGit = resolve(repoRoot, '.git');
if (!existsSync(dotGit) || !statSync(dotGit).isDirectory()) {
  console.log('[prepare] No .git directory found at repo root, skipping husky install.');
  process.exit(0);
}

// Run husky from chicken-3d/ so the locally installed binary is found.
// Husky resolves the git root via `git rev-parse --show-toplevel` and writes
// `core.hooksPath` relative to that, so hooks are correctly registered in the
// outer monorepo.
try {
  execSync('npx --no-install husky .husky', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
} catch (err) {
  console.warn('[prepare] husky install failed (non-fatal):', err?.message ?? err);
  process.exit(0);
}
