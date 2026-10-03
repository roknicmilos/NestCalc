# Installable PWA and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make NestCalc installable on Android as a PWA and deployable to `nestcalc.rokimania.com` on the existing droplet.

**Architecture:** Next's `app/manifest.ts` (backed by a pure, testable builder in `lib/`) plus a hand-written navigation-only service worker make the app installable and online-only. Deployment builds a Next `standalone` bundle locally, rsyncs it to the droplet, and runs it under systemd behind an nginx reverse proxy with basic auth; the data directory is configurable via `NESTCALC_DATA_DIR` and lives outside the rsync target.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Vitest, sharp (icon generation), bash, systemd, nginx.

**Spec:** `docs/superpowers/specs/2026-10-03-pwa-and-deployment-design.md`

## Global Constraints

- Subdomain `nestcalc.rokimania.com`; ssh alias `blueprint-do`.
- App dir `/var/www/nestcalc/prod/app` (rsync target); data dir `/var/www/nestcalc/prod/data` (never rsynced).
- Server listens on `127.0.0.1:3001`; env `NODE_ENV=production`, `PORT=3001`, `HOSTNAME=127.0.0.1`, `NESTCALC_DATA_DIR=/var/www/nestcalc/prod/data`.
- htpasswd file `/etc/nginx/.htpasswd-nestcalc`; unit `/etc/systemd/system/nestcalc.service`; nginx site `/etc/nginx/sites-available/nestcalc.rokimania.com`.
- Next config `output: 'standalone'`. No PWA library. Service worker is online-only: it handles navigation requests only and never touches `/api/*` or any non-navigation request.
- Manifest: `display: 'standalone'`, `start_url: '/'`, icons 192, 512 and maskable 512; name/description from the `meta` dictionary (Serbian default).
- `auth_basic off` only for `/manifest.webmanifest`, `/sw.js`, `/offline.html`, `/icons/`.
- Local dev behaviour (`npm run dev`, `data/storage`) must not change. Vitest only includes `lib/**/*.test.ts`, so new tests live in `lib/` and use relative imports (no `@/` alias in Vitest).
- Do not touch the droplet. Server commands go in `docs/DEPLOY.md` for the user to run.
- Add every new UI string to both dictionaries (this plan adds none beyond the static offline page).

## Review Focus

- Offline `PUT /api/calculator` (saving) must fail visibly, never be answered with the offline HTML page. Pinned in Task 4.
- Non-GET and cross-origin navigations must not be intercepted by the service worker. Pinned in Task 4.
- A redeploy (`rsync --delete`) must never remove the data directory or an existing `calculator.json`. Pinned in Task 5 (script excludes) and Task 6 (docs seed only if absent).
- Missing `calculator.json` on first start returns the existing 404 `notFound` response, not a crash. Covered by documenting the seed step (Task 6) and the existing route behaviour.
- The manifest/icons/`sw.js` must be reachable without basic-auth credentials or the app is not installable. Pinned in Task 6.

---

### Task 1: Configurable storage directory

**Files:**
- Modify: `lib/storage.ts:6-9`
- Test: `lib/storage.test.ts`

**Interfaces:**
- Produces: env var `NESTCALC_DATA_DIR`; when set, `readCalculation`/`writeCalculation` use that directory instead of `<cwd>/data/storage`. Public function signatures unchanged.

- [ ] **Step 1: Write the failing test** in `lib/storage.test.ts` (add `afterEach`, `vi` imports; keep the existing seed test): `'writes and reads calculator.json under NESTCALC_DATA_DIR'`. Create a temp dir with `fs.mkdtemp`, `vi.stubEnv('NESTCALC_DATA_DIR', dir)`, `vi.resetModules()`, dynamically import `./storage`, call `writeCalculation(seed as Calculation)`, assert `fs.readFile(path.join(dir, 'calculator.json'))` exists and `readCalculation()` returns an object with the same `id`. Clean up the dir and `vi.unstubAllEnvs()` in `afterEach`. Add a second test `'reports the configured path when the file is missing'`: with an empty temp dir, `readCalculation()` rejects with `CalculationNotFoundError` whose message contains the temp dir path.
- [ ] **Step 2: Run** `npx vitest run lib/storage.test.ts`. Expected: the new tests FAIL (files written to `data/storage`, not the temp dir).
- [ ] **Step 3: Implement** in `lib/storage.ts`: `const STORAGE_DIR = process.env.NESTCALC_DATA_DIR ?? path.join(process.cwd(), 'data', 'storage');`. Update the doc comment to mention the override.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: allow overriding storage dir via NESTCALC_DATA_DIR`.

---

### Task 2: Web app manifest

**Files:**
- Create: `lib/manifest.ts`, `lib/manifest.test.ts`, `app/manifest.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `buildManifest(meta: { title: string; description: string }): MetadataRoute.Manifest` in `lib/manifest.ts` (relative imports only; type import from `next`). Icon `src` values: `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-maskable-512.png` (created in Task 3).
- Consumes: `getDictionary(locale).meta` from `lib/i18n`, `getLocale()` from `lib/i18n/server`.

- [ ] **Step 1: Write the failing test** `lib/manifest.test.ts`: call `buildManifest({ title: 'NestCalc — kalkulator kupovine nekretnine', description: 'd' })` and assert `display === 'standalone'`, `start_url === '/'`, `name` equals the title, `short_name === 'NestCalc'`, non-empty `theme_color` and `background_color`, an icon with `sizes === '192x192'` and one with `sizes === '512x512'` (both `type === 'image/png'`), and one icon with `purpose === 'maskable'`. Add a test that every `icons[].src` exists as a file under `public/` (resolve with `path.join(__dirname, '..', 'public', src)`); it is expected to fail until Task 3 lands.
- [ ] **Step 2: Run** `npx vitest run lib/manifest.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `buildManifest` in `lib/manifest.ts` and `app/manifest.ts` (default export async function: `buildManifest(getDictionary(await getLocale()).meta)`). In `app/layout.tsx` export `viewport: Viewport = { themeColor: <same colour> }` and extend `generateMetadata` to return `{ ...meta, icons: { apple: '/icons/apple-touch-icon.png' } }`. Use one shared colour constant exported from `lib/manifest.ts`.
- [ ] **Step 4: Run** `npx vitest run lib/manifest.test.ts`. Expected: builder tests PASS; the icon-files test still FAILS (resolved in Task 3). Run `npx tsc --noEmit`; expected clean.
- [ ] **Step 5: Commit** `feat: add web app manifest and viewport theme colour`.

---

### Task 3: Icons

**Files:**
- Create: `scripts/icon.svg`, `scripts/generate-icons.mjs`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon.png`
- Modify: `package.json` (add `sharp` to `devDependencies`, add script `"icons": "node scripts/generate-icons.mjs"`)

**Interfaces:**
- Produces: the four PNGs referenced by Task 2 (`apple-touch-icon.png` is 180×180). Maskable variant keeps the glyph inside the central 80% safe zone on a full-bleed background.

- [ ] **Step 1: Write `scripts/icon.svg`**: a 512×512 house-with-calculator-grid glyph on the theme colour background from `lib/manifest.ts` (same hex value).
- [ ] **Step 2: Implement `scripts/generate-icons.mjs`** (style of `scripts/setup.mjs`): use `sharp` to render the SVG to the four PNGs; the maskable one is rendered from the glyph scaled to 80% and centred on the solid background. Run `npm install -D sharp` first so it is an explicit dependency.
- [ ] **Step 3: Run** `npm run icons`. Expected: four PNGs in `public/icons/`; verify sizes with `file public/icons/*.png` (192×192, 512×512, 512×512, 180×180) and look at one image.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS, including the icon-files test from Task 2.
- [ ] **Step 5: Commit** `feat: add PWA icons and generator script`.

---

### Task 4: Service worker, offline page, registration

**Files:**
- Create: `public/sw.js`, `public/offline.html`, `components/ServiceWorkerRegister/ServiceWorkerRegister.tsx`, `components/ServiceWorkerRegister/index.ts`, `lib/sw.test.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `public/sw.js` registers `install` (precache `/offline.html` only, `skipWaiting`), `activate` (`clients.claim`) and `fetch` listeners. `fetch` calls `event.respondWith` only when `event.request.mode === 'navigate'`; it does `fetch(request)` and on rejection returns the cached `/offline.html`.
- Produces: `ServiceWorkerRegister` default-less named export `ServiceWorkerRegister(): null`, a client component that calls `navigator.serviceWorker.register('/sw.js')` only when `process.env.NODE_ENV === 'production'`.

- [ ] **Step 1: Write the failing test** `lib/sw.test.ts`: read `public/sw.js`, run it with `vm.runInNewContext` against a stub `self` (collects listeners from `addEventListener`), `caches` and `fetch` stubs. Tests:
  - `'does not respond to non-navigation requests'`: fetch event with `request = { mode: 'cors', method: 'PUT', url: '/api/calculator' }`; assert `respondWith` not called.
  - `'does not respond to GET /api requests'`: `{ mode: 'same-origin', method: 'GET', url: '/api/calculator' }`; `respondWith` not called.
  - `'serves /offline.html when a navigation fails'`: `{ mode: 'navigate', method: 'GET' }`, network stub rejects, cache stub's `match('/offline.html')` returns a sentinel; assert the promise passed to `respondWith` resolves to the sentinel.
  - `'passes through successful navigations'`: network resolves a sentinel; `respondWith` promise resolves to it.
- [ ] **Step 2: Run** `npx vitest run lib/sw.test.ts`. Expected: FAIL (file missing).
- [ ] **Step 3: Implement** `public/sw.js` per the Interfaces block, `public/offline.html` (self-contained, inline CSS, bilingual Serbian/English message "Nema internet veze / No internet connection" with a reload button), and `ServiceWorkerRegister` (use `useEffect`; mounted in `app/layout.tsx` inside `<body>`).
- [ ] **Step 4: Run** `npm test && npm run lint && npx tsc --noEmit`. Expected: all clean.
- [ ] **Step 5: Commit** `feat: add online-only service worker with offline fallback`.

---

### Task 5: Standalone build and deploy script

**Files:**
- Modify: `next.config.mjs`, `package.json` (script `"deploy": "bash scripts/deploy.sh"`)
- Create: `scripts/deploy.sh`

**Interfaces:**
- Consumes: Task 1 env var (`NESTCALC_DATA_DIR`), static assets from Tasks 2-4.
- Produces: `npm run deploy` building and shipping `.next/standalone` to `blueprint-do:/var/www/nestcalc/prod/app/`, then `sudo systemctl restart nestcalc`.

- [ ] **Step 1: Set `output: 'standalone'`** in `next.config.mjs`.
- [ ] **Step 2: Implement `scripts/deploy.sh`** (`set -euo pipefail`, runs from repo root regardless of cwd): (1) `npm run build`; (2) `cp -r public .next/standalone/public` and `mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/static`; (3) `rsync -avz --delete --exclude 'data/' --exclude '.env*' .next/standalone/ blueprint-do:/var/www/nestcalc/prod/app/`; (4) `ssh blueprint-do 'sudo systemctl restart nestcalc'`. No flags or dry-run mode. Make it executable.
- [ ] **Step 3: Verify locally**: `npm run build`, stage assets as in step 2 manually, then `PORT=3055 HOSTNAME=127.0.0.1 NESTCALC_DATA_DIR=$(mktemp -d) node .next/standalone/server.js &`. With `curl`: `/` returns 200, `/manifest.webmanifest` returns JSON with `"display":"standalone"`, `/sw.js` and `/icons/icon-192.png` return 200, `/api/calculator` returns 404 (empty data dir), then after copying `data/seeds/calculator.json` into that dir returns 200. Kill the server. Expected: all as stated.
- [ ] **Step 4: Run** `bash -n scripts/deploy.sh` (syntax check). Do NOT execute the script (it deploys).
- [ ] **Step 5: Commit** `feat: build standalone output and add deploy script`.

---

### Task 6: Server config files

**Files:**
- Create: `deploy/nestcalc.service`, `deploy/nginx/nestcalc.rokimania.com.conf`

**Interfaces:**
- Produces: files copied to the server by the steps in Task 7's doc.

- [ ] **Step 1: Write `deploy/nestcalc.service`**: `[Unit]` After `network.target`; `[Service]` `User=www-data`, `WorkingDirectory=/var/www/nestcalc/prod/app`, the four `Environment=` lines from Global Constraints, `ExecStart=/usr/bin/node server.js`, `Restart=always`, `RestartSec=3`; `[Install]` `WantedBy=multi-user.target`. Add a comment that `ExecStart` must match `which node` on the droplet.
- [ ] **Step 2: Write the nginx conf** (HTTP `listen 80` block only; Certbot adds TLS, as for sibling sites): `server_name nestcalc.rokimania.com;`; `location /` with `auth_basic "NestCalc"; auth_basic_user_file /etc/nginx/.htpasswd-nestcalc;` and `proxy_pass http://127.0.0.1:3001;` plus `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` headers; `location ~ ^/(manifest\.webmanifest|sw\.js|offline\.html|icons/.*)$` with `auth_basic off;` and the same proxy settings; `location /_next/static/` with auth left on, the same proxy settings, `expires 1y;` and `add_header Cache-Control "public, immutable";`. Explain each deviation in a short comment.
- [ ] **Step 3: Verify**: if `nginx` exists locally run `nginx -t -c` against a minimal wrapper config including the file; otherwise review manually. Add a Vitest test `lib/deploy-config.test.ts` asserting the nginx file contains `auth_basic off` inside the regex location for `manifest\.webmanifest`, `sw\.js`, `offline\.html` and `icons/`, and that the unit file contains `NESTCALC_DATA_DIR=/var/www/nestcalc/prod/data` and `127.0.0.1`. Run `npm test`; expected PASS.
- [ ] **Step 4: Commit** `feat: add systemd unit and nginx site for nestcalc.rokimania.com`.

---

### Task 7: Documentation

**Files:**
- Create: `docs/DEPLOY.md`
- Modify: `.claude/CLAUDE.md` (Project layout and a "Deploying" pointer)

- [ ] **Step 1: Write `docs/DEPLOY.md`** in Blueprint's structure. Sections: *The target* (same droplet and `blueprint-do` alias, ssh config block; note how NestCalc differs from Blueprint: needs Node and a process, not static); *Server layout* (table from Global Constraints); *First-time setup* with exact commands: DNS `A` record; confirm/install Node LTS (`ssh blueprint-do 'node -v'`) and set `ExecStart` path; confirm port 3001 free (`ss -ltn | grep 3001`); create `/var/www/nestcalc/prod/{app,data}` and `chown` to `www-data`; seed `calculator.json` **only if absent** (`scp data/seeds/calculator.json` then `[ -e ... ] ||` guard); create htpasswd (`sudo htpasswd -c /etc/nginx/.htpasswd-nestcalc <user>`, install `apache2-utils` if needed); install systemd unit, `daemon-reload`, `enable`; limited sudoers line allowing the deploy user to run `systemctl restart nestcalc`; install nginx site, symlink, `nginx -t`, reload, `certbot --nginx -d nestcalc.rokimania.com`; run first `npm run deploy`. *Deploying a new version* (`npm run deploy`, what it does, data untouched). *Backups* (the single file `/var/www/nestcalc/prod/data/calculator.json`, one-line `scp` command). *Installing on Android* (open the URL in Chrome, log in, menu → Install app; note the manifest loads without credentials by design). *Troubleshooting* (`journalctl -u nestcalc`, 404 on `/api/calculator` means the seed step was skipped).
- [ ] **Step 2: Update `.claude/CLAUDE.md`**: add `docs/DEPLOY.md` and `deploy/` to Project layout; one line about `NESTCALC_DATA_DIR`; one line that `public/sw.js` is intentionally navigation-only.
- [ ] **Step 3: Verify**: every command and path in `DEPLOY.md` matches Global Constraints (grep for `/var/www/nestcalc`, `3001`, `.htpasswd-nestcalc`, `nestcalc.service`).
- [ ] **Step 4: Commit** `docs: add deployment guide`.

---

### Task 8: Final verification

- [ ] **Step 1:** `npm test && npm run lint && npx tsc --noEmit && npm run build`. Expected: all pass.
- [ ] **Step 2:** `npm run dev`, open `http://localhost:3000` (per CLAUDE.md, open in the browser), confirm no console errors and that no service worker registers in dev.
- [ ] **Step 3:** Run the standalone server as in Task 5 Step 3 and in Chrome DevTools → Application → Manifest confirm no installability errors and the "Install" prompt is available on localhost.
- [ ] **Step 4:** Report to the user which post-deploy checks remain for them (spec "Verification" last bullet: HTTPS and password prompt, manifest without credentials, Android install, data persists across redeploy).
