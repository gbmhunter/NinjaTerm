<p align="center"><img src="img/logo/v3/github-readme-logo.png" alt="QList" height="200px"></p>

#### A serial port terminal that's got your back.

<br>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Install

NinjaTerm is now a PWA (Progressive Web App). Just visit [https://ninjaterm.mbedded.ninja](https://ninjaterm.mbedded.ninja) to open the app. Click the install button if you want to install in locally and be able to use it offline.

You can also access older versions of NinjaTerm at [GitHub Releases](https://github.com/gbmhunter/NinjaTerm/releases).

## Development

Clone this repo. Then run `npm install` to install dependencies:

```bash
npm install
```

Start the app in the `dev` environment:

```bash
npm run start
```

## To Build The App

```bash
npm run build
```

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

Arduino sketches in `arduino-serial` allow you to program different applications onto an Arduino for testing the serial port with.

## Releasing

1. Create a new branch off of `main` for the changes.
1. Make changes to the code as required.
1. Update the version number to the appropriate number in `package.json`. Major version number change for big changes (e.g. framework change or compete overhaul of UI). Minor version change when additional features have been added. Patch version change for bug fixes and small changes to existing functionality.
1. Update the CHANGELOG (don't forget the links right at the bottom of the page).
1. If you have updated the app data structure, save a copy of the default app data created by the app to `local-storage-data/`. You can do this by running the app, clearing app data in `Settings > General Settings`, loading up the Chrome dev. tools, and copying the key `appData` from local storage.
1. Commit changes and push to your feature/bug fix branch.
1. Create pull request on GitHub merging your branch into `main`.
1. Once the build on `main` has been successfully run, merge your branch into `main` via the merge request.
1. Tag the branch on main with the version number, e.g. `v4.1.0`.
1. Create a release on GitHub pointing to the tag.
1. Enter the CHANGELOG contents into the release body text.

## Deployment

Netlify is used to deploy and host the static NinjaTerm HTML/JS. Netlify automatically deploys when the `main` branch is updated. Netlify also creates preview deploys on pull requests (link will be automatically posted into the PR comments).

## Web App

NinjaTerm used to be a progressive web app (PWA). This older web app is now located in the `web` directory. This also contains the homepage for NinjaTerm, which includes links to the downloaded electron apps and a link to open up the web version of NinjaTerm. The `web` directory is a project in it's own right, see it's `README.md` for more details.

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

## styled_default is not a function

If you get the error:

```
Grid2.js:7 Uncaught TypeError: styled_default is not a function
    at Grid2.js:7:26
```

Comment out the line:

```
include: ['@mui/material/Tooltip', '@emotion/styled', '@mui/material/Unstable_Grid2'],
```

in `vite.config.ts`. This should fix it. You can then uncomment the line again. Toggling this seems to fix this bug, which after reading online might be due to Vite.

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
