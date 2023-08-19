<p align="center"><img src="img/logo/logotype.png" alt="QList" height="200px"></p>

# NinjaTerm

#### A serial port terminal that's got your back.

<br>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.gg/Fjy3vfgy5q)


</div>

## Install

Clone the repo and install dependencies:

```bash
git clone --depth 1 --branch main https://github.com/electron-react-boilerplate/electron-react-boilerplate.git your-project-name
cd your-project-name
npm install
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Native Libraries

The `serialport` library is a native library because it needs to interface with the OS serial port API. Because of this, it has be listed as a dependency in both `package.json` and `release/app/package.json`. A number of configuration lines were also changed to support native libraries, as per https://electron-react-boilerplate.js.org/docs/native-modules.

## Code Architecture

MobX is used to store the application state. The application model is under `src/model/`.

## Extensions

* Prettier ESLint: Provides formatting of .tsx files.


[github-actions-status]: https://github.com/gbmhunter/NinjaTerm/workflows/Test/badge.svg
[github-actions-url]: https://github.com/gbmhunter/NinjaTerm/actions
[github-tag-image]: https://img.shields.io/github/tag/gbmhunter/NinjaTerm.svg?label=version
[github-tag-url]: https://github.com/gbmhunter/NinjaTerm/releases/latest
