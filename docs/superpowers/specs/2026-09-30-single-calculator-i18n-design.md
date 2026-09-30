# Single calculator landing page, i18n, component restructure

## Goals
1. `/` renders the calculation `JqTPX58LSk` (today at `/kalkulacije/JqTPX58LSk`). All other calculators are removed.
2. UI is multilingual: Serbian (default) and English, switchable by the user.
3. `components/` is organised as one directory per component; SCSS lives next to its component.

## 1. Single calculator
- `lib/config.ts`: `export const CALCULATION_ID = 'JqTPX58LSk'`.
- `app/page.tsx` reads the calculation via `readCalculation(CALCULATION_ID)` and renders `<CalculationForm initial={calc} />` (`force-dynamic`). Not found → `notFound()`.
- Remove: `app/kalkulacije/`, `app/page.module.scss` (replace with a minimal page style if needed), `app/api/calculations/route.ts` (list/create), the DELETE handler, `CalculationCard`, `NewCalculationForm`, `listCalculations`, `deleteCalculation`, `calculationExists`, `createCalculationBodySchema`, `CalculationSummary` (if unused after removal), and the four other `data/*.json` files.
- Keep `GET`/`PUT /api/calculations/[id]` (autosave). `PUT` additionally rejects ids other than `CALCULATION_ID`.
- Remove the "← all calculations" breadcrumb; the header shows the app title and the language switcher.

## 2. i18n
- No library. `lib/i18n/`:
  - `sr.ts` — source of truth; defines the dictionary shape (nested object, `as const`-style typed via `export type Dictionary`).
  - `en.ts` — typed as `Dictionary`, so a missing key is a compile error.
  - `index.ts` — `Locale = 'sr' | 'en'`, `DEFAULT_LOCALE = 'sr'`, `LOCALE_COOKIE = 'lang'`, `getDictionary(locale)`.
  - `I18nProvider.tsx` (client context) + `useT()` / `useLocale()` hooks.
- Locale is stored in a `lang` cookie (1 year, path `/`). `app/layout.tsx` reads it via `cookies()`, sets `<html lang>` (`sr-Latn` / `en`), generates localized `metadata` via `generateMetadata`, and wraps children in `I18nProvider`.
- `LanguageSwitcher` component (client): sets the cookie and calls `router.refresh()`.
- Strings with interpolation use functions in the dictionary (`(n: number) => string`) rather than a template parser.
- `lib/format.ts` takes a locale (`sr-Latn-RS` / `en-GB`) for number, currency and date formatting.
- `lib/schemas.ts`: validation messages become dictionary keys resolved at display time (schemas stay locale-free, the form maps the key through `useT()`). Persisted data is unchanged.
- API error strings are translated server-side using the cookie locale.
- PDF export uses the active dictionary and locale.
- User-entered content (calculation name, row labels already stored in the JSON) is not translated.

## 3. Component structure
```
components/
  CalculationForm/
    CalculationForm.tsx
    CalculationForm.module.scss
    CapitalSourceRow/ IncomeSourceRow/ LoanRow/ ExtraRow/ MonthYearInput/  (each: .tsx [+ .module.scss])
    calculation-form-types.ts
    index.ts
  ComputedSummary/   (+ PendingValue/ if only used there)
  PhasesTimeline/
  ExportPdfButton/
  FieldError/        (shared)
  PendingValue/      (shared if used by more than one parent)
  LanguageSwitcher/
```
- Rule: a child used by exactly one parent nests inside the parent's directory; anything used by several stays top-level. Verified with grep at implementation time.
- Each directory has an `index.ts` re-export so imports remain `@/components/Name`.
- SCSS modules move into the owning component's directory; `CalculationForm.module.scss` may be split per child where styles are child-specific.

## Testing / verification
- Existing Vitest calc tests stay green.
- New tests: `sr` and `en` dictionaries have identical key sets (runtime check in addition to TS); locale-aware formatters.
- `npm run lint`, `npm test`, `npm run build` pass; manually verify `/` in both languages, autosave, and PDF export in the running app.

## Out of scope
URL-based locale routing, additional languages, changes to calculation logic or the stored JSON schema.

## Assumptions (from the conversation)
Other `data/*.json` files are deleted; English copy is written by me and reviewed by the user.
