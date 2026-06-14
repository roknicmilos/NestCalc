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

The dev server runs on **http://localhost:3000** by default.

## Tests & linting

```bash
npm test         # Run the Vitest suite once
npm run test:watch  # Run Vitest in watch mode
npm run lint     # Run ESLint (next lint)
```

## Project layout

- `components/` — React UI components (`.tsx`) with co-located SCSS modules.
- `lib/` — calculation logic (`lib/calc/`), Zod `schemas.ts`, `types.ts`,
  `defaults.ts`.
- `styles/` — global SCSS (`globals.scss`).
