<p align="center"><img src="img/logo/logotype.png" alt="QList" height="200px"></p>

#### A serial port terminal that's got your back.

<br>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Install

See the [NinjaTerm homepage](http://gbmhunter.github.io/NinjaTerm/) for Windows, Linux and MacOS executables if you want to install the application.

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

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

Packages are automatically created for Windows, Linux and MacOS in the GitHub action when new commits are pushed to `main`. Before pushing to `main`, make sure:

1. Version number has been updated correctly in `release/app/package.json`.
1. CHANGELOG has been updated.

## Native Libraries

The `serialport` library is a native library because it needs to interface with the OS serial port API. Because of this, it has be listed as a dependency in both `package.json` and `release/app/package.json`. A number of configuration lines were also changed to support native libraries, as per https://electron-react-boilerplate.js.org/docs/native-modules.

## Code Architecture

`electron-react-boilerplate` was used as a starting point for development.

MobX is used to store the application state. The application model is under `src/model/`.

## GitHub Pages

The `docs/` folder contains the source code for the NinjaTerm homepage, hosted by GitHub Pages. This is automatically build and deployed with new commits pushed to `main`.

## Extensions

* Prettier ESLint: Provides formatting of .tsx files.

[github-actions-status]: https://github.com/gbmhunter/NinjaTerm/workflows/Test/badge.svg
[github-actions-url]: https://github.com/gbmhunter/NinjaTerm/actions
[github-tag-image]: https://img.shields.io/github/tag/gbmhunter/NinjaTerm.svg?label=version
[github-tag-url]: https://github.com/gbmhunter/NinjaTerm/releases/latest
