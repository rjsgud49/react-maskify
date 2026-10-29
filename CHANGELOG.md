# Changelog

## 0.3.1 — 2026-10-29

- **Fix:** the codemod no longer rewrites `react-input-mask` inside comments or string literals. `--help` lists `.mts` and `.cts`, and the directories it skips (`node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`).
- **Fix:** CJS builds share chunks, so `react-maskify` and `react-maskify/compat` export the same component.
- Docs: `maskOptions.slots` (one entry per mask position; a per-position placeholder is also exposed as `placeholder`). The migration guide notes that subpath imports and `declare module 'react-input-mask'` are not rewritten.
- Dev: vitest 4.1.12, which clears the dev-only audit findings in tinypool and `@vitest/mocker`. Dependabot groups npm minor and patch updates; major updates stay individual pull requests.
- CI: `actions/setup-node` 7, `actions/upload-artifact` 7, `actions/configure-pages` 6, `actions/deploy-pages` 5.

## 0.3.0 — 2026-10-21

- New entry `react-maskify/compat`: default export `InputMask` for code written against react-input-mask. Also exports `Props` and `InputState` types.
- `children` accepts a single element (react-input-mask v3) as well as a render function (v2).
- `maskPlaceholder` accepts a string as long as the mask, e.g. `dd/mm/yyyy`.
- `beforeMaskedValueChange` now receives `userInput` and v2-shaped `maskOptions` (`mask`, `maskChar`, `permanents`, `formatChars`, `alwaysShowMask`). Values returned by `beforeMaskedValueChange` / `beforeMaskedStateChange` are rendered as returned.
- `mask` can be a function `(value) => mask`.
- New entry `react-maskify/presets`: Korean masks (`phoneMaskKR` for 02 / area codes / 010 / 15xx, business number, resident number, card, date) and validators (`isValidMobileKR`, `isValidLandlineKR`, `isValidBizNoKR`, `isValidRRN`, `maskRRN`, `isValidCardNumber`, `isValidDateKR`).
- CLI codemod: `npx react-maskify migrate <paths> [--dry]` rewrites `react-input-mask` imports to `react-maskify/compat`.
- Docs: migration section in the README and `docs/MIGRATION.md`.
- Dependabot config.

## 0.2.0 — 2026-10-16

- **Fix:** the deferred focus handler could move the caret back to the first empty slot if the user started typing right after focusing (before the timer fired), scrambling the input order (e.g. `01012345678` → `012-3456-7801`). It now re-reads the live value and leaves the caret alone once the user has typed.
- Real-browser end-to-end tests with Playwright (Chromium, Firefox, WebKit): typing, backspace/delete in the middle and around literals, paste, selection replace, caret position, controlled mode, and Korean IME composition (via Chrome DevTools Protocol). Run in CI.
- Live demo site (`/demo`, Vite + React) with presets, react-input-mask migration side-by-side and a react-hook-form example, deployed to GitHub Pages; StackBlitz link.
- README: CI badge, demo and StackBlitz links.

## 0.1.1 — 2026-10-16

- Add repository / homepage / bugs links.

## 0.1.0 — 2026-10-16

Initial release.

- `InputMask` component, API-compatible with `react-input-mask` v2 (`mask`, `maskChar`, `formatChars`, `alwaysShowMask`, `beforeMaskedValueChange`, `inputRef`, children render prop) plus v3 names (`maskPlaceholder`, `beforeMaskedStateChange`).
- No `findDOMNode`: works on React 17, 18 and 19 (ref-as-prop and `forwardRef`).
- `useMask` headless hook.
- Pure utilities: `formatWithMask`, `unmask`, `isComplete`, `parseMask`.
- Presets: Korean/US/intl phone, card numbers, expiry, dates, time, ZIP, Korean RRN / business number.
- Caret preservation for typing, backspace/delete (including over literals), paste and selection replace.
- IME (Korean/Japanese/Chinese) composition-safe.
- SSR-safe. Zero runtime dependencies. ESM + CJS + TypeScript types.
