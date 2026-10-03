# NestCalc

A Next.js (App/Pages) real-estate calculator app written in TypeScript with SCSS
modules, React Hook Form + Zod, and Vitest for tests.

## Running the app

Requirements: Node.js with npm. Dependencies are installed via `npm install`.

```bash
npm run dev      # Start the dev server (http://localhost:3000) with hot reload
npm run build    # Production build
npm run start    # Serve the production build (run `npm run build` first)
```

The dev server runs on **http://localhost:3000** by default (Next.js falls back to
another port if 3000 is taken).

When running the app for the user, open the served URL in the default browser once
the dev server reports it's ready (use the actual port from the startup output).

## Tests & linting

```bash
npm test         # Run the Vitest suite once
npm run test:watch  # Run Vitest in watch mode
npm run lint     # Run ESLint (next lint)
```

## Project layout

- `app/` — Next.js App Router. `/` renders the single calculator; `api/calculator` serves GET/PUT for it.
- `data/` — `seeds/calculator.json` is the tracked seed; `npm run setup` (also run on `npm install`)
  copies seeds into `data/storage/` (git-ignored, the machine-local "database" the app reads/writes).
- `components/` — one directory per component (`Name/Name.tsx`, `Name.module.scss`,
  `index.ts`). Children used by a single parent live in the parent's directory
  (e.g. `CalculationForm/LoanRow/`); shared ones (`FieldError`, `PendingValue`,
  `LanguageSwitcher`) are top-level.
- `lib/` — calculation logic (`lib/calc/`), Zod `schemas.ts` (validation messages are
  dictionary keys), `types.ts`, `defaults.ts`, locale-aware `format.ts`.
- `lib/i18n/` — Serbian (default, `sr.ts` defines the `Dictionary` shape) and English
  (`en.ts`) dictionaries. Locale is stored in the `lang` cookie; use `useT()` /
  `useLocale()` in client components and `getLocale()` (`lib/i18n/server.ts`) on the server.
  Add every new UI string to both dictionaries.
- `styles/` — global SCSS (`globals.scss`).
- `public/` — PWA assets: `sw.js` (intentionally navigation-only; never intercepts `/api/*`), `offline.html`,
  `icons/` (generated from `scripts/icon.svg` by `npm run icons`).
- `deploy/` — systemd unit and nginx site for the droplet. `docs/DEPLOY.md` has the setup and `npm run deploy` flow.
  On the server the data dir is set via `NESTCALC_DATA_DIR` (defaults to `data/storage` locally).
