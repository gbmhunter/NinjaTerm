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
npm start
```

## Testing

Arduino sketches in `arduino-serial` allow you to program different applications onto an Arduino for testing the serial port with.

## Releasing

1. Update the version number to the appropriate number in `package.json`. Major version number change for big changes (e.g. framework change or compete overhaul of UI). Minor version change when additional features have been added. Patch version change for bug fixes and small changes to existing functionality.
1. Update the CHANGELOG (don't forget the links right at the bottom of the page).
1. Commit changes and push to `develop`.
1. Create pull request on GitHub merging `develop` into `main`.
1. Once the build on `develop` has been successfully run, merge the `develop` branch into `main` via the merge request.
1. Tag the branch on main with the version number, e.g. `v4.1.0`.
1. Create a release on GitHub pointing to the tag.
1. Enter the CHANGELOG contents into the release body text.
1. Checkout the `develop` branch and fast-forward it to the new commit on `main`.

## Deployment

Netlify is used to deploy and host the static NinjaTerm HTML/JS. Netlify automatically deploys when the `main` branch is updated. Netlify also creates preview deploys on pull requests (link will be automatically posted into the PR comments).

## Code Architecture

Create React App (CRA) with the typescript PWA template [docs here](https://create-react-app.dev/docs/making-a-progressive-web-app/) was used as a starting point for development:

```bash
npx create-react-app my-app --template cra-template-pwa-typescript
```

The React based user interface code is under `src/view`.

MobX is used to store the application state (model). The React component redraw themselves based on the state of the model. The application model is under `src/model/`.

## Graphing

Both recharts and chart.js was trialed for graphing data coming in on a serial port.

chart.js was chosen as it offered much better performance when the data update rate was fast. rechart could handle about 100 points, any more than that at the render time per new point started to take more than 50ms. chart.js can re-render 1000 points and stay under that limit.

## Fonts

In FontCreator, make sure the setting _Tools->Options->Fonts->Exclude unused glyphs_ is unchecked, otherwise glyphs at code points like `0x0001` will not be generated.

## Theme Colors

* `#DC3545` (red): Primary colour, used for logo.
* `#E47F37` (orange): Secondary colour, used for buttons on homepage.

## Extensions

* Prettier ESLint: Provides formatting of .tsx files.

[github-actions-status]: https://github.com/gbmhunter/NinjaTerm/workflows/Test/badge.svg
[github-actions-url]: https://github.com/gbmhunter/NinjaTerm/actions
[github-tag-image]: https://img.shields.io/github/tag/gbmhunter/NinjaTerm.svg?label=version
[github-tag-url]: https://github.com/gbmhunter/NinjaTerm/releases/latest
