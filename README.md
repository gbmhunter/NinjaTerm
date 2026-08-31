<p align="center"><img src="img/logo/v3/github-readme-logo.png" alt="The NinjaTerm logo." height="200px"></p>

#### An embedded developer's terminal that's got your back.

<br>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Install

If you want to use NinjaTerm, visit the [NinjaTerm homepage](https://ninjaterm.mbedded.ninja) to download the desktop application or use the older web-based version (the web-based version is no longer being updated).

From the homepage there are also links to the [NinjaTerm manual](https://ninjaterm.mbedded.ninja/docs/manual/).

You can also access older versions of NinjaTerm at [GitHub Releases](https://github.com/gbmhunter/NinjaTerm/releases).

The rest of this README is for developers who want to contribute to NinjaTerm.

## Directory Structure

Below is the directory structure of this repository:

```
ninjaterm/
├── firmware-test-apps/ # Contains firmware test applications (Arduino sketches and a Zephyr RTT test app) used for exercising NinjaTerm against real hardware.
├── docs/ # Contains Docusaurus website which contains the homepage, installation guide and manual. Self-contained node project.
├── src/ # Contains the Electron application code.
├── tests/ # Contains the end-to-end tests using Playwright.
├── web/ # Contains the web-based version of NinjaTerm. Self-contained node project.
```

## Development

Node 22 is the supported version, pinned in `.node-version` (and separately in
`docs/.node-version` and `web/.node-version` for those sub-projects). CI reads
those files rather than hardcoding a version, so bumping one is a one-line
change. 22 is chosen to match the Node that Electron itself bundles — Electron
38.3.0 ships Node 22.20.0 — so the toolchain and the shipped runtime agree.
`nvm use` and `fnm` both read `.node-version`.

Clone this repo. Then run `npm install` to install dependencies:

```bash
npm install
```

Start electron for development:

```bash
npm run dev
```

## To Build The App

```bash
npm run build
```

## To Build A Single Executable

```bash
npm run dist
```

This will be generated in the `dist` directory.

## Testing

Both unit tests and end-to-end tests can be run with:

```shell
npm run test
```

### Unit Tests

Unit tests are run with `vitest`, which has good integration with Vite.

To run just the unit tests, use the command:

```shell
npx vitest run
```

### E2E Tests

End-to-end (E2E) (a.k.a. integration tests) are performed using [Playwright](https://playwright.dev/). The Playwright tests are located in the `tests/` directory, and the Playwright config is at `playwright.config.ts`.

To run just the E2E tests from command line:

```bash
npx playwright test
```

The Playwright plug-in for VS Code is recommended if interacting with these tests, as it makes running and debugging of them easy!

### Real Tests With An Arduino 

Arduino sketches in `firmware-test-apps/arduino_*/` allow you to program different applications onto an Arduino for testing the serial port with.

## Releasing

Releases are fully automated from a single command. Prerequisites on release day:

1. You're on `main` with a clean working tree, and the merge of the dev branch has landed.
2. The CHANGELOG's `## Unreleased` section covers everything going out.
3. If the app data schema (`LATEST_VERSION` in `src/renderer/src/model/AppDataManager/DataClasses/AppData.ts`) was bumped this cycle, save a fresh default snapshot:
   - Run `npm run dev` and open the app.
   - `Settings → General → Clear app data`.
   - DevTools Console: `copy(localStorage.getItem('appData'))`.
   - Save clipboard to `local-storage-data/appData-v{N}-app-v{X.Y.Z}-default.json`.

Then cut the release. Always pass the full version explicitly — no `patch` /
`minor` / `major` shortcuts, just one consistent form for stable, prerelease, or
otherwise:

```
npm run release 5.11.0         # next minor
npm run release 5.10.1         # patch
npm run release 5.11.0-rc.1    # prerelease
npm run release v5.11.0        # v-prefix accepted too
```

Choosing a number follows semver:

- **Major** (`X.0.0`) — breaking changes. Examples from the README's history:
  framework change, complete UI overhaul.
- **Minor** (`5.X.0`) — new features added without breaking existing ones.
- **Patch** (`5.10.X`) — bug fixes and small changes to existing functionality.

The script runs typecheck + unit tests + the snapshot preflight, finalizes
CHANGELOG (moves `Unreleased` into a dated section and adds the compare link),
writes `package.json`, commits `Release v{X.Y.Z}`, tags `v{X.Y.Z}` (annotated),
and pushes `main` with the tag. Pass `--preview` to see what the changes would
look like without writing anything, or `--allow-dev` to release from a non-`main`
branch. **Flags need the `--` separator:**

```
npm run release -- 5.11.0 --preview
npm run release -- 5.11.0 --allow-dev
```

`npm run` treats any `--flag` after the script name as one of its own config
options and never forwards it, so `npm run release 5.11.0 --preview` (no
separator) would otherwise cut a real release. The script defends against that
by also reading the `npm_config_*` variables npm sets for flags it swallowed —
it warns and honours the flag rather than releasing — but the `--` form is the
one to use.

From there CI takes over: it builds and signs all three platforms, uploads the
installers / updater manifests to a **draft** GitHub Release, and only flips
the release public once every artifact is attached (with the `## [X.Y.Z]`
section from CHANGELOG.md as the Release body). The draft stage matters:
auto-updaters can't see drafts, so existing installs never hit a 404 on
`latest.yml` while uploads are still in flight — and if any platform build
fails, the release stays an invisible draft rather than going out incomplete.

**How CI works:**
- On every `main` / `dev` push: `test-electron` runs unit tests, the Electron
  e2e suite (Ubuntu), and a packaging smoke-test on all three platforms with
  `--publish never`. No upload.
- On a `v*` tag push: `test-electron` runs first, then `create-draft-release`
  creates the draft GitHub Release (one canonical release — avoids the
  electron-builder matrix race that can create duplicates), then the `release`
  job rebuilds all three platforms with signing + `electron-builder --publish
  always` (uploading into the draft — `releaseType: "draft"` in package.json's
  `build.publish`). A final `publish-release` job fills the Release body from
  CHANGELOG and publishes the draft via `gh release edit --draft=false`.

## Deployment

Cloudflare Pages hosts the documentation site at `ninjaterm.mbedded.ninja`, built from `docs/`. See [MIGRATION-CLOUDFLARE.md](MIGRATION-CLOUDFLARE.md) for the project settings and how deploys are triggered.

Previously hosted on Netlify, which paused both projects in August 2026 when the account ran out of usage credits.

## Web App

NinjaTerm used to be a progressive web app (PWA). This older web app is now located in the `web` directory. The `web` directory is a project in it's own right, see it's `README.md` for more details.

This is no longer being updated and is in maintenance mode only.

The web app is deployed by Cloudflare Pages to `ninjaterm-app.mbedded.ninja`, built from `web/`.

### styled_default is not a function

If you get the following error in the web app:

```
Grid2.js:7 Uncaught TypeError: styled_default is not a function
    at Grid2.js:7:26
```

Comment out the line:

```
include: ['@mui/material/Tooltip', '@emotion/styled', '@mui/material/Unstable_Grid2'],
```

in `vite.config.ts`. This should fix it. You can then uncomment the line again. Toggling this seems to fix this bug, which after reading online might be due to Vite.

## Graphing

Both recharts and chart.js was trialed for graphing data coming in on a serial port.

chart.js was chosen as it offered much better performance when the data update rate was fast. rechart could handle about 100 points, any more than that at the render time per new point started to take more than 50ms. chart.js can re-render 1000 points and stay under that limit.

## Performance

NinjaTerm can easily handle 50kB/s of incoming serial data when maximized on a 1920x1080 screen. Reported "CPU usage" inside the app (busy time of the main javascript event loop) is around 50% when this is happening on my machine.

Make sure that often updating React components are in their own MobX `observer`s. Prior to doing this, I had things like the throughput, CPU usage, and TX/RX activity bulbs (all in the bottom status bar) directly in the main AppView component. This causes the entire app to re-render when any of these values change, at caused noticeable performance problems at 10kB/s.

## Fonts

FontCreator was used to create the special `NinjaTerm` font. It is based of Consolas. The FontCreator project file is at `src/fonts/NinjaTerm.fcp` and the generated font files are `NinjaTerm-Regular.woff` and `NinjaTerm-Regular.woff2`.

The PUA (Personal Use Area) is used to add custom glyphs to represent control characters and generic hex bytes. The following code point ranges are used:

* `U+E000` - `U+E07F`: Contains control character glyphs were applicable. Add `0xE000` to a byte which contains a control character to get the equivalent glyph.
* `U+E100` - `U+E1FF`: Contains a glyph for each byte from `0x00` to `0xFF` containing the byte as a hex number. For example, `U+E100` contains a glyph that says `00`, and `U+E1FF` contains a glyph that says `FF`. Add `0xE100` to a normal byte to get the corresponding glyph.

In FontCreator, make sure the setting _Tools->Options->Fonts->Exclude unused glyphs_ is unchecked, otherwise glyphs at code points like `0x0001` will not be generated.

## Theme Colors

* `#DC3545` (red): Primary colour, used for logo.
* `#E47F37` (orange): Secondary colour, used for buttons on homepage.

## Saving App Data

Settings are stored to the browser's local storage. The app data is saved under the key `appData`. The `AppDataManager` class is responsible for loading the data, updating it to the latest version if out of date, and saving it back to local storage.

The folder `local-storage-data/` contains some example app data files for different versions of the app.

The files with `default` in the name are the default data for that app version. These are used in the unit tests to make sure upgrading app data works correctly.

## Extensions

* Prettier ESLint: Provides formatting of .tsx files.
* Playwright: Provides useful add-ons for running and debugging the Playwright E2E tests.

[github-actions-status]: https://github.com/gbmhunter/NinjaTerm/actions/workflows/build-and-test.yml/badge.svg?branch=main
[github-actions-url]: https://github.com/gbmhunter/NinjaTerm/actions
[github-tag-image]: https://img.shields.io/github/tag/gbmhunter/NinjaTerm.svg?label=version
[github-tag-url]: https://github.com/gbmhunter/NinjaTerm/releases/latest
