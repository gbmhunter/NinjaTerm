#!/usr/bin/env node
// One-command release driver. Bumps version, finalizes CHANGELOG, commits,
// tags, and pushes. CI (build-and-test.yml) picks up the tag push and
// publishes the GitHub Release with signed artifacts and release notes
// extracted from CHANGELOG.
//
// Usage:
//   npm run release patch         # 5.10.0 -> 5.10.1
//   npm run release minor         # 5.10.0 -> 5.11.0
//   npm run release major         # 5.10.0 -> 6.0.0
//   npm run release 5.11.0-rc.1   # explicit version
//   npm run release patch --dry-run
//   npm run release minor --allow-dev

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allowDev = args.includes('--allow-dev');
const bumpArg = args.find((a) => !a.startsWith('--'));

if (!bumpArg) {
  console.error('Usage: npm run release <patch|minor|major|X.Y.Z> [--dry-run] [--allow-dev]');
  process.exit(2);
}

const sh = (cmd, opts = {}) =>
  execSync(cmd, { cwd: repoRoot, stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
const shInherit = (cmd) => execSync(cmd, { cwd: repoRoot, stdio: 'inherit' });

// --- Preflight ---------------------------------------------------------------

const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main' && !allowDev) {
  console.error(`Refusing to release from branch "${branch}". Pass --allow-dev to override.`);
  process.exit(1);
}

const dirty = sh('git status --porcelain');
if (dirty) {
  console.error('Working tree is not clean. Commit or stash first:\n' + dirty);
  process.exit(1);
}

console.log('Running typecheck...');
shInherit('npx tsc');

console.log('Running unit tests...');
shInherit('npm run test:unit');

console.log('Checking app-data snapshot...');
shInherit('node scripts/check-appdata-snapshot.mjs');

// --- Compute next version ----------------------------------------------------

const pkgPath = join(repoRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const prevVersion = pkg.version;

function bump(prev, kind) {
  const m = prev.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!m) throw new Error(`Unparseable current version: ${prev}`);
  let [, maj, min, pat] = m.map((v, i) => (i === 0 ? v : Number(v)));
  if (kind === 'patch') pat += 1;
  else if (kind === 'minor') { min += 1; pat = 0; }
  else if (kind === 'major') { maj += 1; min = 0; pat = 0; }
  else throw new Error(`Unknown bump kind: ${kind}`);
  return `${maj}.${min}.${pat}`;
}

const newVersion = /^\d+\.\d+\.\d+/.test(bumpArg) ? bumpArg : bump(prevVersion, bumpArg);
const newTag = `v${newVersion}`;

if (sh('git tag -l ' + newTag)) {
  console.error(`Tag ${newTag} already exists locally.`);
  process.exit(1);
}

// --- Edit package.json -------------------------------------------------------

const newPkg = readFileSync(pkgPath, 'utf8').replace(
  /"version":\s*"[^"]+"/,
  `"version": "${newVersion}"`,
);

// --- Edit CHANGELOG.md -------------------------------------------------------

const changelogPath = join(repoRoot, 'CHANGELOG.md');
let changelog = readFileSync(changelogPath, 'utf8');
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

if (!changelog.includes('## Unreleased')) {
  console.error('CHANGELOG.md has no "## Unreleased" section; cannot finalize automatically.');
  process.exit(1);
}
// 1. Insert the new version heading right after "## Unreleased" (leaving Unreleased empty for next cycle).
changelog = changelog.replace(
  /## Unreleased\n+/,
  `## Unreleased\n\n## [${newVersion}] - ${today}\n\n`,
);
// 2. Insert compare link above the previous version's link entry.
const compareLine = `[${newVersion}]: https://github.com/gbmhunter/NinjaTerm/compare/v${prevVersion}...v${newVersion}\n`;
const prevLinkLine = `[${prevVersion}]: `;
if (!changelog.includes(prevLinkLine)) {
  console.error(`Could not find "${prevLinkLine}" compare-link anchor in CHANGELOG.md.`);
  process.exit(1);
}
changelog = changelog.replace(prevLinkLine, compareLine + prevLinkLine);

// --- Dry-run ----------------------------------------------------------------

if (dryRun) {
  console.log(`\n--- DRY RUN: would release ${newTag} (${prevVersion} -> ${newVersion}) ---`);
  console.log(`\npackage.json version field would become: "${newVersion}"\n`);
  console.log('CHANGELOG.md would gain heading:  ## [' + newVersion + '] - ' + today);
  console.log('CHANGELOG.md would gain link:     ' + compareLine.trim());
  console.log('\nNo files written, no commit made.');
  process.exit(0);
}

// --- Apply + commit + tag + push --------------------------------------------

writeFileSync(pkgPath, newPkg);
writeFileSync(changelogPath, changelog);

console.log(`\nCommitting release ${newTag}...`);
shInherit('git add package.json CHANGELOG.md');
shInherit(`git commit -m "Release ${newTag}"`);
shInherit(`git tag ${newTag}`);

console.log(`Pushing ${branch} and ${newTag}...`);
shInherit(`git push origin ${branch} --follow-tags`);

console.log(`\nDone. Watch CI: https://github.com/gbmhunter/NinjaTerm/actions`);
console.log(`Release will appear at: https://github.com/gbmhunter/NinjaTerm/releases/tag/${newTag}`);
