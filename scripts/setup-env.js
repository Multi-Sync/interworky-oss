#!/usr/bin/env node

/**
 * Distributes the root .env file to each package that needs it.
 *
 * - packages/core/        → .env.development (dotenv-handler format)
 * - packages/ws-assistant/ → .env (dotenv format)
 * - packages/dashboard/   → .env.local (Next.js format)
 *
 * Run automatically via `npm run dev` or manually via `node scripts/setup-env.js`
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootEnv = path.join(rootDir, '.env');

if (!fs.existsSync(rootEnv)) {
  console.log('[setup-env] No root .env file found. Copy .env.example to .env first.');
  console.log('  cp .env.example .env');
  process.exit(1);
}

const envContent = fs.readFileSync(rootEnv, 'utf-8');

const targets = [
  { dir: 'packages/core', file: '.env.development' },
  { dir: 'packages/ws-assistant', file: '.env' },
  { dir: 'packages/dashboard', file: '.env.local' },
];

for (const target of targets) {
  const targetDir = path.join(rootDir, target.dir);
  if (!fs.existsSync(targetDir)) continue;

  const targetFile = path.join(targetDir, target.file);
  fs.writeFileSync(targetFile, envContent);
  console.log(`[setup-env] Wrote ${target.dir}/${target.file}`);
}

console.log('[setup-env] Done. Environment files distributed to all packages.');
