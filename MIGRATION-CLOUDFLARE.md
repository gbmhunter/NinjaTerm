# Moving the two web properties from Netlify to Cloudflare Pages

Netlify paused both projects in August 2026 when the account ran out of usage
credits. While paused they served **HTTP 503**, which also broke the four
in-app "Open Manual" links that ship in the desktop app (`AppView.tsx`,
`GraphingView.tsx`, `RxSettingsView.tsx`, `TxSettingsView.tsx`).

Both sites are plain static builds with no Netlify-specific behaviour, so they
move across cleanly. Cloudflare Pages' free tier is unmetered on requests and
bandwidth (500 builds/month), which is the axis Netlify stopped us on.

| Site | Domain | Source | Build | Output |
|---|---|---|---|---|
| Docs (Docusaurus 3.8) | `ninjaterm.mbedded.ninja` | `docs/` | `npm run build` | `build` |
| Web app (Vite 6 + react-router) | `ninjaterm-app.mbedded.ninja` | `web/` | `npm run build` | `dist` |

## What already changed in the repo

- **`docs/wrangler.toml`, `web/wrangler.toml`** — replace the deleted
  `netlify.toml` files. Only the output directory lives here; the build command
  and root directory are set per project.
- **`docs/.node-version`, `web/.node-version`** — pin Node 22.
  `docs/netlify.toml` pinned Node 18, which has no `wrangler.toml` equivalent —
  Pages reads `.node-version`. **This is a version bump**: Node 18 went
  end-of-life in April 2025. Docusaurus 3.8 and Vite 6 both support 22.
- **`web/public/_redirects`** — new. react-router needs every route served from
  `index.html` or a deep link 404s. Pages supports same-origin 200 rewrites.
- **`docs/static/_redirects`** — deleted. It held two rules, both dead:
  - `/app/* → https://app.ninjaterm.mbedded.ninja/:splat 200`. That hostname
    has never resolved (the real project is `ninjaterm-**app**.mbedded.ninja`),
    and `netlify.toml` rules outrank `_redirects` on Netlify, so the catch-all
    below shadowed it regardless. **This was also the only genuine
    incompatibility with Pages** — a cross-origin `200` proxy is the one thing
    Pages' `_redirects` cannot do. It being already inert is what makes this
    migration a straight lift.
  - `/* → /index.html 200`. Docusaurus emits real HTML per route plus its own
    `404.html`, which Pages serves natively. The catch-all would have shadowed
    that proper 404 page.

If the `/app/*` proxy was *meant* to work, decide separately what it should do.
A cross-origin **302** is supported by Pages; a transparent proxy needs a Pages
Function. Nothing depends on it today.

## Status: done (2026-08-31)

Both sites are live on Cloudflare Pages and serving `200`:

| | Pages project | `*.pages.dev` | Custom domain |
|---|---|---|---|
| Docs | `ninjaterm-docs` | `ninjaterm-docs.pages.dev` | `ninjaterm.mbedded.ninja` |
| Web app | `ninjaterm-app` | `ninjaterm-app.pages.dev` | `ninjaterm-app.mbedded.ninja` |

`mbedded.ninja` was already on Cloudflare DNS, so the two existing CNAMEs were
repointed from `*.netlify.app` to `*.pages.dev` in place.

**Gotcha worth knowing if you ever re-attach a domain.** Setting those CNAMEs to
*proxied* (orange cloud) left both sites returning **522/523** and the Pages
domain stuck at `status: pending`, `validation_data.method: http`. Pages was
validating over HTTP, and a proxied record sends that request back into
Cloudflare's edge instead of out to the Pages origin, so it could never
complete. Setting the records to **DNS-only** (grey cloud) resolved it
immediately. That also matches how they were configured for Netlify.

Deploys on push are wired up too: `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` are repository secrets, and
`.github/workflows/deploy-docs.yml` / `deploy-web.yml` build and upload each
site when its own directory changes.

## Deploying: Direct Upload from GitHub Actions (recommended)

Pages can build from a connected Git repo, but **connecting the repo requires an
OAuth flow in the dashboard** that an API token cannot perform. Direct Upload
avoids that entirely, keeps the deploy definition in the repo, and reuses the
CI that already exists.

Create an API token at *My Profile → API Tokens* with:

- `Account → Cloudflare Pages → Edit`
- `Zone → DNS → Edit` and `Zone → Zone → Read`, scoped to `mbedded.ninja`
  (only needed for attaching the custom domains)

Store it as the repository secret `CLOUDFLARE_API_TOKEN`, plus
`CLOUDFLARE_ACCOUNT_ID` (`gh secret set CLOUDFLARE_API_TOKEN` reads the value
from stdin, so it stays out of your shell history and the process list). Do not
commit it or paste it into a chat.

Both projects already exist, so this is only for reference if one is ever
recreated:

```bash
npx wrangler pages project create ninjaterm-docs --production-branch main
npx wrangler pages project create ninjaterm-app  --production-branch main
```

A manual deploy, run from `docs/` or `web/` after a build:

```bash
npx wrangler pages deploy --project-name=ninjaterm-docs --branch=main
```

To automate it, a workflow per site — `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy docs
on:
  push:
    branches: [main]
    paths: ['docs/**', '.github/workflows/deploy-docs.yml']
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: docs/.node-version
          cache: npm
          cache-dependency-path: docs/package-lock.json
      - run: npm ci
        working-directory: docs
      - run: npm run build
        working-directory: docs
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: docs
          command: pages deploy build --project-name=ninjaterm-docs
```

The web app version is the same with `docs` → `web`, `build` → `dist`, and
`--project-name=ninjaterm-app`. Keep the `paths:` filter so a change to the
Electron app doesn't redeploy both sites.

Both workflows are committed and the secrets are set, so this is a description
of what is running rather than something to do. Each is also
`workflow_dispatch`-able for a manual redeploy, and uses a `concurrency` group
so a newer commit supersedes an in-flight deploy instead of racing it.

## Custom domains and DNS

Attach each domain to its project (*Pages → project → Custom domains*, or the
API). If `mbedded.ninja` is already on Cloudflare DNS, Pages creates the record
itself and it is live in seconds. If DNS is elsewhere, point each host at its
`*.pages.dev` target with a CNAME.

Check `ninjaterm.mbedded.ninja` first — it is the one the shipped desktop app
links to.

## Verifying

```bash
for u in https://ninjaterm.mbedded.ninja/ \
         https://ninjaterm.mbedded.ninja/manual \
         https://ninjaterm-app.mbedded.ninja/; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L "$u")  $u"
done
```

All three should return `200`. Before the migration all three returned `503`.
They were verified returning `200` on 2026-08-31 after the cutover.

Also confirm, since these are the things the config changes actually affect:

- A deep link into the web app (e.g. `/settings`) loads instead of 404ing —
  proves `web/public/_redirects` survived the build into `dist/`.
- An unknown docs path (e.g. `/no-such-page`) shows the Docusaurus 404 page
  rather than the homepage — proves removing the catch-all was right.
- `https://ninjaterm.mbedded.ninja/manual#sending-data-tx-mode` resolves to the
  TX mode section, which is what v5.18.0's TX Settings "Open Manual" button
  opens.

## Rolling back

The Netlify projects still exist, paused. `git revert` the commit that removed
the `netlify.toml` files and unpause them.
