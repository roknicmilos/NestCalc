# Single Calculator, i18n, Component Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `JqTPX58LSk` the landing page (removing all other calculators), add Serbian/English UI, and reorganise `components/` into one directory per component.

**Architecture:** Remove the multi-calculator surface first (less code to translate/move), then move components into directories (pure refactor), then add a dependency-free typed i18n layer (dictionaries + React context, locale in a `lang` cookie read in the root layout), then translate each component group.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, SCSS modules, React Hook Form + Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-30-single-calculator-i18n-design.md`

## Global Constraints

- Default locale `sr` (`<html lang="sr-Latn">`); second locale `en` (`<html lang="en">`). Only these two.
- Cookie name `lang`, 1 year, path `/`. No URL prefix.
- Calculation id constant `JqTPX58LSk` in `lib/config.ts` (`CALCULATION_ID`).
- Stored JSON schema and calculation logic unchanged; user-entered text in stored data is not translated.
- `en.ts` is typed as `Dictionary` (defined by `sr.ts`) so missing keys fail `tsc`.
- Import paths stay `@/components/<Name>` via per-directory `index.ts`.
- Every task ends with `npm test`, `npm run lint` and `npx tsc --noEmit` green. Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Commit only when the user has approved committing (they have not yet; ask once before Task 1's commit and reuse the answer).

## Review Focus

- Missing/invalid `lang` cookie (e.g. `lang=de`) → falls back to `sr`, never throws. (Task 3)
- `PUT /api/calculations/<other-id>` → 400; `GET` of a missing data file → 404 on the page (`notFound()`). (Task 1)
- Plural forms: `formatMonthsAsYearsAndMonths` for 1, 2, 5, 11, 12, 13, 21, 25 months in both `sr` and `en` ("1 month", "2 months"). (Task 4)
- Non-finite numbers still format as `—` in both locales. (Task 4)
- Validation message key with no dictionary entry → `FieldError` shows the raw message instead of crashing. (Task 5)
- Computed loan rows `mortgage` / `ppap-savings` display translated names in English, while user loans keep their stored labels. (Task 5)

---

### Task 1: Collapse to the single calculator

**Files:**
- Create: `lib/config.ts`
- Modify: `app/page.tsx`, `app/page.module.scss`, `app/api/calculations/[id]/route.ts`, `lib/storage.ts`, `lib/schemas.ts`, `lib/types.ts` (drop `CalculationSummary` if unused), `CLAUDE.md` (layout note if it mentions the list)
- Delete: `app/kalkulacije/`, `app/api/calculations/route.ts`, `components/CalculationCard.*`, `components/NewCalculationForm.*`, `data/{nL5hKRFhy9,N-YgxhWILG,uwhZNPhJ38,Xr5IWBwBCh}.json`
- Test: `lib/storage.test.ts` (extend `vitest.config.ts` include unchanged — `lib/**/*.test.ts` already matches)

**Interfaces:**
- Produces: `export const CALCULATION_ID = 'JqTPX58LSk'` from `@/lib/config`; `app/page.tsx` renders `<CalculationForm initial={calc} />`.

- [ ] **Step 1: Write the failing test** `lib/storage.test.ts`: `readCalculation('does-not-exist')` rejects with `CalculationNotFoundError`; `readCalculation(CALCULATION_ID)` resolves with `id === 'JqTPX58LSk'`.
- [ ] **Step 2: Run** `npx vitest run lib/storage.test.ts` — expect FAIL (`@/lib/config` missing; also add the `@` alias to `vitest.config.ts` via `resolve.alias` if imports with `@/` fail).
- [ ] **Step 3: Create `lib/config.ts`** with `CALCULATION_ID`.
- [ ] **Step 4: Rewrite `app/page.tsx`**: `force-dynamic`; `readCalculation(CALCULATION_ID)`; `CalculationNotFoundError` → `notFound()`; render `<main className={styles.page}><CalculationForm initial={calc} /></main>`. Replace `app/page.module.scss` with only `.page` (max-width 1200px, same padding as the old `kalkulacije/[id]` page). Header/title/switcher are added in Task 3.
- [ ] **Step 5: Remove** everything listed under Delete; drop `listCalculations`, `deleteCalculation`, `calculationExists` from `lib/storage.ts`; drop `createCalculationBodySchema` and (if unused) `calculationSummarySchema`/`CalculationSummary`. In `app/api/calculations/[id]/route.ts` delete `DELETE`, and make `GET`/`PUT` return 404/400 for any `id !== CALCULATION_ID`.
- [ ] **Step 6: Run** `npm test && npm run lint && npx tsc --noEmit` — expect PASS. Then `npm run dev`, open `http://localhost:3000/` and confirm the form loads with the saved data; edit a field and confirm autosave still succeeds (no console/network errors).
- [ ] **Step 7: Commit** `refactor: keep only the JqTPX58LSk calculator as landing page`.

---

### Task 2: Component directories (pure refactor)

**Files:**
- Move (git mv) into `components/CalculationForm/`: `CalculationForm.tsx`, `CalculationForm.module.scss`, `calculation-form-types.ts`, and child dirs `CapitalSourceRow/`, `IncomeSourceRow/`, `LoanRow/`, `ExtraRow/`, `MonthYearInput/` (each `Name.tsx` + `index.ts`; child styles keep importing the parent's `CalculationForm.module.scss` via `../CalculationForm.module.scss`, or are split into `Name.module.scss` when the classes are used by that child alone).
- Move: `ComputedSummary/`, `PhasesTimeline/`, `ExportPdfButton/`, `FieldError/`, `PendingValue/` (each `Name.tsx`, `Name.module.scss` if any, `index.ts`).
- `components/CalculationForm/index.ts` re-exports `CalculationForm`; same for every directory.

**Interfaces:**
- Produces: `@/components/CalculationForm`, `@/components/ComputedSummary`, `@/components/PhasesTimeline`, `@/components/ExportPdfButton`, `@/components/FieldError`, `@/components/PendingValue`. Children reached only through the parent directory.

- [ ] **Step 1: Decide nesting by grep.** `MonthYearInput` is used by the form, `LoanRow`, `IncomeSourceRow` → keep it inside `CalculationForm/` (parent of all users). `FieldError` is used by the form and all rows → top-level shared. `PendingValue` is used by `ComputedSummary` and `PhasesTimeline` → top-level shared. `ExportPdfButton`, `ComputedSummary`, `PhasesTimeline` are used only by `CalculationForm` → nest inside `CalculationForm/`. Revise Files above accordingly before moving.
- [ ] **Step 2: `git mv`** files, add `index.ts` re-exports, fix relative imports. No behavior or class-name changes.
- [ ] **Step 3: Run** `npm test && npm run lint && npx tsc --noEmit && npm run build` — expect PASS.
- [ ] **Step 4: Commit** `refactor: one directory per component`.

---

### Task 3: i18n core, layout, language switcher

**Files:**
- Create: `lib/i18n/sr.ts`, `lib/i18n/en.ts`, `lib/i18n/index.ts`, `lib/i18n/I18nProvider.tsx`, `lib/i18n/server.ts`, `components/LanguageSwitcher/{LanguageSwitcher.tsx,LanguageSwitcher.module.scss,index.ts}`
- Modify: `app/layout.tsx`, `app/page.tsx`
- Test: `lib/i18n/i18n.test.ts`

**Interfaces:**
- Produces (`lib/i18n/index.ts`): `type Locale = 'sr' | 'en'`; `LOCALES: readonly Locale[]`; `DEFAULT_LOCALE: Locale`; `LOCALE_COOKIE = 'lang'`; `isLocale(v: unknown): v is Locale`; `getDictionary(locale: Locale): Dictionary`; `type Dictionary = typeof sr` (re-export from `sr.ts`).
- Produces (`lib/i18n/server.ts`, server only): `getLocale(): Promise<Locale>` — reads the `lang` cookie via `next/headers`, falls back to `DEFAULT_LOCALE` if absent or invalid.
- Produces (`I18nProvider.tsx`, `'use client'`): `<I18nProvider locale dictionary>`; `useT(): Dictionary`; `useLocale(): Locale`.
- Produces: `<LanguageSwitcher />` — two buttons "SR" / "EN" (active one `aria-pressed`), sets `document.cookie = lang=<l>; path=/; max-age=31536000; samesite=lax` then `router.refresh()`.
- Dictionary shape (initial; later tasks add sections): `meta: { title, description }`, `app: { title, subtitle }`, `language: { sr: 'Srpski', en: 'English', label }`.

- [ ] **Step 1: Write failing tests** `lib/i18n/i18n.test.ts`: `isLocale('sr')`/`isLocale('en')` true, `isLocale('de')`/`isLocale(undefined)` false; `getDictionary('en')` and `getDictionary('sr')` have identical recursive key sets (helper `flattenKeys(obj): string[]`, compare sorted arrays) — this test is reused by every later task; `getDictionary('sr')` is the default when given an unknown value via `getDictionary(isLocale(x) ? x : DEFAULT_LOCALE)`.
- [ ] **Step 2: Run** `npx vitest run lib/i18n` — expect FAIL.
- [ ] **Step 3: Implement** the files above. `sr.ts` exports `const sr = {...}` (no `as const` on string values; functions allowed), `en.ts` exports `const en: Dictionary`. Existing Serbian title/description from `app/layout.tsx` go into `sr.meta`.
- [ ] **Step 4: Layout.** `app/layout.tsx` becomes async: `generateMetadata()` uses `getDictionary(await getLocale()).meta`; `RootLayout` sets `<html lang={locale === 'sr' ? 'sr-Latn' : 'en'}>` and wraps `children` in `<I18nProvider>`.
- [ ] **Step 5: Page header.** In `app/page.tsx` render a header row with `<h1>{t.app.title}</h1>` and `<LanguageSwitcher />` above the form (page is a server component: use `getDictionary(await getLocale())`).
- [ ] **Step 6: Run** `npm test && npm run lint && npx tsc --noEmit`, then in the dev app click EN/SR: `<html lang>` and title change, choice survives reload.
- [ ] **Step 7: Commit** `feat: add typed i18n core and language switcher`.

---

### Task 4: Locale-aware formatting

**Files:**
- Modify: `lib/format.ts`, every caller of `formatEur | formatRsd | formatMonthYear | formatMonthsAsYearsAndMonths` (under `components/`)
- Test: `lib/format.test.ts`

**Interfaces:**
- Produces: all `format*` functions take `locale: Locale` as **first** argument: `formatEur(locale, value)`, `formatRsd(locale, eurValue, rate)`, `formatMonthYear(locale, my)`, `formatMonthsAsYearsAndMonths(locale, months)`. Intl locale map: `sr → 'sr-Latn-RS'`, `en → 'en-GB'`. Formatters are cached per locale. `formatDateTime` is deleted (unused after Task 1).
- Consumes: `Locale` from `@/lib/i18n`.
- Callers get the locale from `useLocale()`; in Task 5–6 calls are finished as components are translated — in this task, pass `useLocale()` at each existing call site only.

- [ ] **Step 1: Write failing tests** in `lib/format.test.ts`: `formatMonthsAsYearsAndMonths('sr', n)` for n = 1→`1 mesec`, 2→`2 meseca`, 5→`5 meseci`, 11→`11 meseci`, 12→`1 godina`, 13→`1 godina 1 mesec`, 25→`2 godine 1 mesec`; `('en', n)`: 1→`1 month`, 2→`2 months`, 12→`1 year`, 13→`1 year 1 month`, 25→`2 years 1 month`; `formatEur('en', NaN)` and `formatEur('sr', Infinity)` → `—`; `formatMonthYear('en', {year: 2027, month: 3})` contains `March` and `2027`; `inputValueToMonthYear`/`monthYearToInputValue` round-trip unchanged.
- [ ] **Step 2: Run** `npx vitest run lib/format.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** the signature change; Serbian plural rules stay as-is, English uses `n === 1 ? singular : plural`.
- [ ] **Step 4: Update all call sites** (`grep -rn "format\(Eur\|Rsd\|MonthYear\|MonthsAs\)" components`), then run `npm test && npm run lint && npx tsc --noEmit` — expect PASS.
- [ ] **Step 5: Commit** `feat: locale-aware formatting`.

---

### Task 5: Translate schemas, defaults, computed labels, shared components

**Files:**
- Modify: `lib/schemas.ts`, `lib/defaults.ts`, `lib/i18n/sr.ts`, `lib/i18n/en.ts`, `components/FieldError/FieldError.tsx`, `components/CalculationForm/CalculationForm.tsx` (only the `useForm` resolver and the `mortgage`/`ppap-savings` label display; broader text in Task 6)
- Test: `lib/i18n/validation.test.ts`

**Interfaces:**
- `schemas.ts` messages become dictionary keys under `validation` (value = key string): `nameRequired`, `nameTooLong`, `areaTooLong`, `streetTooLong`, `extraRequired`, `extraTooLong`, `amountMin0`, `pctRange`, `termInteger`, `termMin1`, `termMax`, `priceMin0`, `areaMin0` (square meters), `linkInvalid`, `costsMin0`, `rateMin`. Exact Serbian texts are the current literals; English texts are written by the implementer.
- `FieldError({ message })` looks up `t.validation[message as keyof …] ?? message`.
- `defaultLoanLabel(type, t: Dictionary): string` and `createDefaultCalculation(name, t: Dictionary)` use `t.defaults.{cashLoan, privateLoan, rent, savings}`. Since the landing page never creates calculations, `createDefaultCalculation` may be deleted together with its last caller if unused — check with grep, delete rather than translate.
- Computed loan names: add helper `componentLabel(c: { loanId: string; label: string }, t: Dictionary): string` in `lib/i18n/index.ts` returning `t.computed.mortgage` for `'mortgage'`, `t.computed.ppapSavings` for `'ppap-savings'`, else `c.label`. `lib/calc/*` is unchanged.

- [ ] **Step 1: Write failing tests** `lib/i18n/validation.test.ts`: every message string found in `calculationSchema.safeParse(badInput)` issues (feed one invalid value per rule: negative price, rate 101, term 0, term 601, term 1.5, bad link, empty name, empty extra text) is a key of `sr.validation` AND `en.validation`; `componentLabel({loanId:'mortgage',label:'Stambeni kredit'}, en)` → the English mortgage name; unknown loan id returns the stored label; `FieldError` fallback is covered by asserting the lookup helper `translateMessage(t, 'nonexistent')` returns `'nonexistent'` (export that helper from `lib/i18n/index.ts` and use it in `FieldError`).
- [ ] **Step 2: Run** `npx vitest run lib/i18n` — expect FAIL.
- [ ] **Step 3: Implement** keys in both dictionaries, schema changes, helpers; add `defaults` and `computed` sections to the dictionaries.
- [ ] **Step 4: Run** `npm test && npm run lint && npx tsc --noEmit` — expect PASS (key-parity test from Task 3 included).
- [ ] **Step 5: Commit** `feat: translatable validation, defaults and computed labels`.

---

### Task 6: Translate UI components

Split into two commits (6a, 6b). Both follow the same rule: every Serbian literal in JSX, `aria-*`, `placeholder`, `title`, `window.confirm/alert` and option lists moves to a dictionary section named after the component (`summary`, `timeline`, `form`, `loanRow`, `incomeRow`, `capitalRow`, `extraRow`, `monthYear`), accessed with `const t = useT()`. Interpolated strings are functions in the dictionary. Enum option labels (propertyType, seller, ppapTiming, loan type) become maps `Record<EnumValue, string>` in the dictionary.

**Files:**
- 6a Modify: `components/CalculationForm/ComputedSummary/*`, `components/CalculationForm/PhasesTimeline/*` (or wherever Task 2 placed them), `components/PendingValue/*`, `lib/i18n/{sr,en}.ts`
- 6b Modify: `components/CalculationForm/CalculationForm.tsx`, `CapitalSourceRow`, `IncomeSourceRow`, `LoanRow`, `ExtraRow`, `MonthYearInput`, `lib/i18n/{sr,en}.ts`

**Interfaces:**
- Consumes: `useT`, `useLocale`, `componentLabel`, locale-first `format*` (Tasks 3–5).
- Produces: dictionary sections named above; `sr` values are the exact current strings (no Serbian wording changes).

- [ ] **Step 1 (6a/6b): Extract** every user-visible Serbian string by `grep -nE "[šđčćžŠĐČĆŽ]|>[A-Za-zŠ][^<{]*<" <files>`, add to `sr.ts`, add English to `en.ts`.
- [ ] **Step 2: Replace** literals with `t.…`; use `componentLabel` when rendering phase components / summary loan lines.
- [ ] **Step 3: Extend the key-parity test** (already in `i18n.test.ts`) — it must stay green; add a test `no Serbian diacritics in en.ts values` asserting no `š đ č ć ž` appear in any flattened `en` string (`flattenValues`).
- [ ] **Step 4: Run** `npm test && npm run lint && npx tsc --noEmit`; in the dev app, walk the page in EN (all sections: property, capital sources, loans, income, extras, summary, timeline; open each row editor; trigger a validation error) and confirm no Serbian text remains and SR looks identical to before.
- [ ] **Step 5: Commit** `feat: translate <group> components`.

---

### Task 7: PDF export and API errors

**Files:**
- Modify: `components/CalculationForm/ExportPdfButton/ExportPdfButton.tsx`, `app/api/calculations/[id]/route.ts`, `lib/i18n/{sr,en}.ts`, `lib/i18n/server.ts`

**Interfaces:**
- Consumes: `useT`, `useLocale` in the button; `getLocale`/`getDictionary` in the route.
- Produces: dictionary sections `pdf` (button label, file name prefix, any text drawn into the PDF, error message) and `api` (`notFound`, `invalidJson`, `invalidData`, `idMismatch`).

- [ ] **Step 1:** Replace literals in both files with dictionary lookups (route handlers use `getDictionary(await getLocale())`). Date/number text in the PDF uses the locale-first formatters.
- [ ] **Step 2: Run** `npm test && npm run lint && npx tsc --noEmit` — expect PASS.
- [ ] **Step 3: Manual check:** export the PDF in SR and EN (text language and file name follow the active language); `curl -i -X PUT localhost:3000/api/calculations/other -H 'content-type: application/json' -d '{}'` → 400/404 with a Serbian message by default, English when `-H 'cookie: lang=en'`.
- [ ] **Step 4: Commit** `feat: translate PDF export and API errors`.

---

### Task 8: Final verification

- [ ] **Step 1:** `grep -rnE "[šđčćžŠĐČĆŽ]" app components lib --include=*.ts --include=*.tsx | grep -v "lib/i18n/sr.ts\|\.test\.ts"` → only acceptable hits are stored-data related; nothing in JSX.
- [ ] **Step 2:** `npm test && npm run lint && npm run build` all pass.
- [ ] **Step 3:** Update `CLAUDE.md` project layout (components directories, `lib/i18n/`, single calculator, `lib/config.ts`).
- [ ] **Step 4:** Run the app, open the browser at the served URL, confirm: `/` shows the calculator, `/kalkulacije/JqTPX58LSk` is 404, language switch works and persists, autosave works, PDF export works in both languages.
- [ ] **Step 5: Commit** `docs: update project layout`.
