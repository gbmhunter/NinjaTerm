<p align="center"><img src="img/logo/logotype.png" alt="QList" height="200px"></p>

<br>

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Install

Dependencies:

1. `npm`
1. `yarn`
1. `git`

```bash
git clone
yarn
```

## Development

Start the app in the `dev` environment:

```bash
yarn start
```

**Running Lint Checks**

```bash
yarn lint
```

**Running Typescript Checks**

```bash
yarn tsc
```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

Packages are created in the `release` directory. Because the native module `serialport` is used, each package has to be built on it's respective platform.

## Maintainers

- [Geoffrey Hunter](https://github.com/gbmhunter)

## License

MIT © [gbmhunter](https://github.com/gbmhunter)

[github-actions-status]: https://github.com/gbmhunter/ninjaterm-electron/workflows/Test/badge.svg
[github-actions-url]: https://github.com/gbmhunter/ninjaterm-electron/actions
[github-tag-url]: https://github.com/gbmhunter/ninjaterm-electron/releases/latest
