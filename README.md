<p align="center"><img src="img/logo/logotype.png" alt="QList" height="200px"></p>

# NinjaTerm

#### A serial port terminal that's got your back.

<br>

<br>

<div align="center">

Tests Status: ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/gbmhunter/NinjaTerm/Test)

Publish Status: ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/gbmhunter/NinjaTerm/Publish)

Latest Release: ![GitHub release (latest by date)](https://img.shields.io/github/v/release/gbmhunter/NinjaTerm)

</div>

## Install

Required dependencies before install:

1. `npm`
1. `yarn`
1. `git`

Then just run:

```bash
git clone
yarn
```

## Development

Start the app in the `dev` environment:

```bash
yarn start
```

Note: Icon in development will default to Electron icon even though NinjaTerm icon will be used when packaging for releases, see [https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/1710#issuecomment-414199480](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/1710#issuecomment-414199480).

**Running Tests**

```bash
yarn build # Only needed if app has not been built via other means yet
yarn test
```

**Running Lint Checks**

```bash
yarn lint
```

**Running Typescript Checks**

```bash
yarn tsc
```

**Skip Husky Pre-commit Checks**

Use the `--no-verify` flag as shown:

```bash
git commit --no-verify -m "Message goes here."
```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

Packages are created in the `release` directory. Because the native module `serialport` is used, each package has to be built on it's respective platform.

Packaging is performed by the `electron-builder` library. The config for this is contained within the top-level `package.json` under `"build"`.

Version number is contained within the "inner" `package.json` at `src/package.json`.

## CICD

GitHib Actions are used for running automated tests and creating releases (which include built and packaged executables for all supported platforms).

## Maintainers

- [Geoffrey Hunter](https://github.com/gbmhunter)

## History

Electron version based of the electron-react-boilerplate repo, at `v1.4.0`.

## License

MIT © [gbmhunter](https://github.com/gbmhunter)

[github-actions-status]: https://github.com/gbmhunter/ninjaterm/workflows/Test/badge.svg
[github-actions-url]: https://github.com/gbmhunter/ninjaterm/actions
[github-tag-url]: https://github.com/gbmhunter/ninjaterm/releases/latest
