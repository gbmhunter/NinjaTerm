#!/usr/bin/env node
// Release preflight: ensures a default app-data snapshot exists in
// local-storage-data/ for the current AppData.LATEST_VERSION. See the
// README "Releasing" section for why this matters and how to capture it.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const appDataTs = readFileSync(
  join(repoRoot, 'src/renderer/src/model/AppDataManager/DataClasses/AppData.ts'),
  'utf8',
);
const versionMatch = appDataTs.match(/export\s+const\s+LATEST_VERSION\s*=\s*(\d+)/);
if (!versionMatch) {
  console.error('Could not find "export const LATEST_VERSION = N" in AppData.ts.');
  process.exit(2);
}
const latestVersion = Number(versionMatch[1]);

const snapshotDir = join(repoRoot, 'local-storage-data');
const pattern = new RegExp(`^appData-v${latestVersion}-.*\\.json$`);
const matches = readdirSync(snapshotDir).filter((f) => pattern.test(f));

if (matches.length === 0) {
  console.error(
    `Missing local-storage-data/appData-v${latestVersion}-*.json snapshot for the current AppData.LATEST_VERSION.\n` +
      '\n' +
      'To create one:\n' +
      '  1. Run `npm run dev` and open the app.\n' +
      '  2. Settings → General → Clear app data (or DevTools: localStorage.removeItem("appData"); location.reload();).\n' +
      '  3. DevTools Console: copy(localStorage.getItem("appData"))\n' +
      `  4. Save clipboard to local-storage-data/appData-v${latestVersion}-app-v<X.Y.Z>-default.json\n`,
  );
  process.exit(1);
}

console.log(`OK: ${matches[0]} covers AppData.LATEST_VERSION=${latestVersion}.`);
