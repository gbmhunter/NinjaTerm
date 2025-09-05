# NinjaTerm Documentation

This directory contains the official documentation for NinjaTerm, built with [Docusaurus](https://docusaurus.io/).

## Development

To run the documentation site locally:

```bash
npm start
```

This will start a local development server and open a browser window at `http://localhost:3000/docs/`.

## Building

To build the documentation for production:

```bash
npm run build
```

The built static files will be in the `build/` directory.

## Content

The documentation is organized as follows:

- `docs/intro.md` - Getting started guide
- `docs/features.md` - Feature overview with videos
- `docs/manual.md` - Complete user manual including:
  - ANSI escape codes
  - Terminal features
  - Graphing (prefix-based and command-based)
  - API reference

## Assets

All images and videos are stored in `static/img/` and can be referenced in documentation using `/img/filename`.

## Deployment

The documentation can be deployed alongside the main NinjaTerm website or as a standalone documentation site.