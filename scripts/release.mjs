#!/usr/bin/env node
// One-command release driver. Bumps version, finalizes CHANGELOG, commits,
// tags, and pushes. CI (build-and-test.yml) picks up the tag push and
// publishes the GitHub Release with signed artifacts and release notes
// extracted from CHANGELOG.
//
// Usage:
//   npm run release 5.11.0             # or any explicit semver
//   npm run release v5.11.0            # v-prefix accepted, normalized away
//   npm run release 5.11.0-rc.1        # prerelease
//   npm run release -- 5.11.0 --preview
//   npm run release -- 5.11.0 --allow-dev
//
// NB: flags need the `--` separator. `npm run` treats ANY `--flag` after the
// script name as one of its own config options and does not forward it to the
// script — this is not special to npm's own flag names, so renaming the flag
// does not help. Without the separator, `npm run release 5.11.0 --preview`
// arrives here with no `--preview` in argv and cuts a real release.
//
// Because getting that wrong publishes something, we also read the
// `npm_config_*` variables npm sets for the flags it swallowed, and honour
// them. So the un-separated form warns rather than silently doing the
// dangerous thing.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

/**
 * True if `--<flag>` was passed, whether it reached argv or npm swallowed it
 * into a `npm_config_*` environment variable (npm lowercases the name and turns
 * dashes into underscores). Warns in the swallowed case so the correct
 * invocation gets learned, but still honours the flag — silently ignoring a
 * swallowed `--preview` would cut a real release.
 */
const hasFlag = (flag) => {
  if (args.includes(`--${flag}`)) {
    return true;
  }
  if (process.env[`npm_config_${flag.replace(/-/g, '_')}`] === 'true') {
    console.warn(
      `Warning: npm consumed "--${flag}" instead of passing it to this script; honouring it anyway.\n` +
        `         Use the "--" separator to pass flags through directly:\n` +
        `           npm run release -- <version> --${flag}`,
    );
    return true;
  }
  return false;
};

const preview = hasFlag('preview');
const allowDev = hasFlag('allow-dev');
const rawVersionArg = args.find((a) => !a.startsWith('--'));

if (!rawVersionArg) {
  console.error('Usage: npm run release <X.Y.Z[-prerelease]> [--preview] [--allow-dev]');
  console.error('Example: npm run release 5.11.0');
  console.error('Example: npm run release 5.11.0-rc.1 --preview');
  process.exit(2);
}

// Accept v-prefix (v5.11.0) — normalize it away. We re-add the `v` only for the git tag.
const newVersion = rawVersionArg.replace(/^v/, '');
if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(newVersion)) {
  console.error(`"${rawVersionArg}" is not a valid semver version (expected e.g. 5.11.0 or 5.11.0-rc.1).`);
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

// --- Record current version --------------------------------------------------

const pkgPath = join(repoRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const prevVersion = pkg.version;

if (newVersion === prevVersion) {
  console.error(`New version ${newVersion} matches current package.json version; nothing to release.`);
  process.exit(1);
}

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

// --- Preview ----------------------------------------------------------------

if (preview) {
  console.log(`\n--- PREVIEW: would release ${newTag} (${prevVersion} -> ${newVersion}) ---`);
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
// Annotated tag (-a -m) so `git push --follow-tags` will push it alongside the
// commit. Lightweight tags are NOT pushed by --follow-tags, which was a bug in
// earlier versions of this script.
shInherit(`git tag -a ${newTag} -m "Release ${newTag}"`);

console.log(`Pushing ${branch} and ${newTag}...`);
shInherit(`git push origin ${branch} --follow-tags`);

console.log(`\nDone. Watch CI: https://github.com/gbmhunter/NinjaTerm/actions`);
console.log(`Release will appear at: https://github.com/gbmhunter/NinjaTerm/releases/tag/${newTag}`);
