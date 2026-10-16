# Changelog

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
