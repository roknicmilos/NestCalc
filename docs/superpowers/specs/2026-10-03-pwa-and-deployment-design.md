# Installable PWA and Deployment — Design

Date: 2026-10-03

## Goals

1. NestCalc can be installed on an Android phone as a PWA (Chrome "Install app").
2. NestCalc is deployed to `nestcalc.rokimania.com` on the existing DigitalOcean droplet, following the conventions in
   Blueprint's `docs/DEPLOY.md` (ssh alias `blueprint-do`, nginx + Certbot, `/var/www/<project>/<env>/...`), with
   matching instructions in this repo's `docs/DEPLOY.md`.

## Decisions (agreed)

| Topic | Decision |
|-------|----------|
| Access control | nginx HTTP basic auth (htpasswd). No app-level login. |
| Runtime | Next.js `output: 'standalone'` built locally, rsynced, run by systemd under a system Node install. |
| Offline | Installable, **online-only**. Minimal service worker with an offline fallback page. No caching of API data. |
| PWA tooling | No library (no next-pwa/Serwist). Use Next's `app/manifest.ts` plus a hand-written `public/sw.js`. |
| Port | `127.0.0.1:3001` (assumed free; confirm on the droplet). |

## Key difference from Blueprint

Blueprint is a static bundle served by nginx; Node is deliberately absent from the droplet. NestCalc has a server:
`app/api/calculator` reads/writes `data/storage/calculator.json`, and the locale cookie is read server-side. A static
export is not possible, so the droplet needs a Node runtime, a process manager, and nginx as a reverse proxy. The
"build locally, copy artifacts" flow is preserved.

The API has no authentication, so a public URL would expose and allow overwriting the user's financial data; hence basic
auth at nginx.

## 1. PWA

- `app/manifest.ts`: name/short name/description from the existing `meta` dictionary, `display: 'standalone'`,
  `start_url: '/'`, `theme_color`/`background_color`, icon list (192, 512, maskable 512).
- `public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`. Generated from a
  single SVG source by a script in `scripts/` (house/calculator glyph); generated PNGs are committed.
- `public/sw.js`: handles `fetch` for navigation requests only: network first, falling back to `/offline.html` on
  failure. Never intercepts `/api/*` or other requests.
- `public/offline.html`: static, self-contained fallback page.
- `components/ServiceWorkerRegister`: client component, registers `/sw.js` in production only; mounted in the root
  layout.
- `app/layout.tsx`: export `viewport` with `themeColor`; add apple-touch icon via metadata.
- Test (Vitest): manifest contains the fields Chrome requires for installability (name, `start_url`, `display`, 192 and
  512 icons).
- Note: the manifest is served in the default locale (Serbian) regardless of the `lang` cookie unless trivially
  derivable; acceptable for a single-user tool.

## 2. Deployment

### Build and packaging

- `next.config.mjs`: add `output: 'standalone'`.
- `lib/storage.ts`: storage directory becomes `process.env.NESTCALC_DATA_DIR ?? path.join(process.cwd(), 'data',
  'storage')`. Local dev behaviour is unchanged. Existing storage tests must still pass; add a test for the env override
  if the module structure allows it.
- `scripts/deploy.sh` (exposed as `npm run deploy`):
  1. `npm run build`
  2. copy `public/` and `.next/static/` into `.next/standalone/` (required by standalone output)
  3. `rsync -avz --delete .next/standalone/ blueprint-do:/var/www/nestcalc/prod/app/`
  4. `ssh blueprint-do 'sudo systemctl restart nestcalc'`
  The script fails fast (`set -euo pipefail`) and never touches the data directory.

### Server layout

| | |
|---|---|
| App (rsync target) | `/var/www/nestcalc/prod/app` |
| Data (never rsynced) | `/var/www/nestcalc/prod/data` (holds `calculator.json`) |
| htpasswd | `/etc/nginx/.htpasswd-nestcalc` |
| systemd unit | `/etc/systemd/system/nestcalc.service` |
| nginx site | `/etc/nginx/sites-available/nestcalc.rokimania.com` |
| Subdomain | `nestcalc.rokimania.com` |

Data lives outside the rsync target so `--delete` cannot remove it.

### Files committed to the repo

- `deploy/nestcalc.service`: runs `node server.js` in the app dir; env `NODE_ENV=production`, `PORT=3001`,
  `HOSTNAME=127.0.0.1`, `NESTCALC_DATA_DIR=/var/www/nestcalc/prod/data`; non-root user; `Restart=always`.
- `deploy/nginx/nestcalc.rokimania.com.conf`: HTTP server block (Certbot adds TLS and the redirect, as for sibling
  sites) that:
  - proxies `/` to `http://127.0.0.1:3001` with `Host`, `X-Forwarded-*` headers;
  - enables `auth_basic` with the htpasswd file;
  - sets `auth_basic off` for `/manifest.webmanifest`, `/sw.js`, `/offline.html` and `/icons/`. Chrome fetches the
    manifest without credentials, so protecting it would break installability. These files contain no user data;
  - serves `/_next/static/` with `Cache-Control: public, immutable` and a 1-year expiry (fingerprinted filenames).
  `sw.js` must not be cached long-term so updates propagate.
- `docs/DEPLOY.md`, in Blueprint's structure: target, server layout, first-time setup (DNS A record, directories,
  Node prerequisite check, seed `calculator.json` if absent, htpasswd, systemd unit, nginx site, Certbot), deploying a
  new version, data backup note, and installing on Android.

### Prerequisites not verifiable from this repo

- Node (LTS, matching the major used locally) installed on the droplet. Blueprint's doc says Node is absent; this is a
  one-time install the first-time setup section documents.
- Port 3001 free; DNS `A` record for `nestcalc.rokimania.com`.
- `sudo` rights for the deploy user to restart the service (a sudoers entry limited to that command is documented).

No server changes are made by the implementation without the user running or approving them.

## Out of scope

App-level login, offline data/sync, CI/CD, Docker, automated data backups.

## Verification

- `npm test` and `npm run lint` pass.
- `npm run build` succeeds; standalone server starts locally (`node .next/standalone/server.js`) and serves `/`,
  `/api/calculator`, `/manifest.webmanifest`.
- Lighthouse / Chrome DevTools "Application" panel shows the app installable (manually, over localhost or after deploy).
- Post-deploy: HTTPS loads behind the password prompt; manifest and icons load without credentials; Android Chrome
  offers "Install app"; data persists across a redeploy.
