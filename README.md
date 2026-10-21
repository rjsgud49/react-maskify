# react-maskify

[![npm version](https://img.shields.io/npm/v/react-maskify.svg)](https://www.npmjs.com/package/react-maskify)
[![npm downloads](https://img.shields.io/npm/dw/react-maskify.svg)](https://www.npmjs.com/package/react-maskify)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-maskify)](https://bundlephobia.com/package/react-maskify)
[![license](https://img.shields.io/npm/l/react-maskify.svg)](./LICENSE)
[![CI](https://github.com/rjsgud49/react-maskify/actions/workflows/ci.yml/badge.svg)](https://github.com/rjsgud49/react-maskify/actions/workflows/ci.yml)

Input mask component and hook for React 17, 18 and 19. It accepts the props of
[react-input-mask](https://github.com/sanniassin/react-input-mask) v2 and v3, so existing code can switch by changing the import.

[Live demo](https://rjsgud49.github.io/react-maskify/) · [Migration guide](./docs/MIGRATION.md) · [Changelog](./CHANGELOG.md)

- No `findDOMNode`. Works with React 19 and StrictMode. `ref` works as a prop and through `forwardRef`.
- No runtime dependencies. ESM and CJS builds with TypeScript types. About 3 KB min+gzip.
- Keeps the caret in place when typing, deleting in the middle, pasting and replacing a selection.
- Waits for IME composition (Korean, Japanese, Chinese) to finish before applying the mask.
- Renders on the server (Next.js, Remix) without touching `window`.
- Korean phone, business number, resident number, card and date presets with validators in `react-maskify/presets`.

## Install

```bash
npm i react-maskify
```

## Usage

```tsx
import InputMask from 'react-maskify';

<InputMask mask="999-9999-9999" placeholder="010-0000-0000" />
<InputMask mask="9999 9999 9999 9999" maskChar={null} />
<InputMask mask="99/99/9999" maskPlaceholder="dd/mm/yyyy" alwaysShowMask />
```

### Mask syntax

| char | accepts |
| --- | --- |
| `9` | `[0-9]` |
| `a` | `[A-Za-z]` |
| `*` | `[A-Za-z0-9]` |
| `\` | makes the next character a literal (`'+\\9 999'` in JS → `+9 ___`) |

Any other character is a literal. `formatChars` replaces the default rules:

```tsx
<InputMask mask="#999999" formatChars={{ 9: '[0-9a-fA-F]' }} />
```

A mask can also be an array of literals and RegExps, or a function that returns a mask for the current value:

```tsx
<InputMask mask={['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/]} />
<InputMask mask={(value) => (value.startsWith('02') ? '99-9999-9999' : '999-9999-9999')} maskChar={null} />
```

### Controlled

```tsx
const [phone, setPhone] = useState('');
<InputMask mask="999-9999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
```

`e.target.value` is the masked value. `unmask(value, mask)` returns only the typed characters.

### Custom input

Both the v2 render function and the v3 single element work:

```tsx
<InputMask mask="9999-99-99" value={v} onChange={onChange}>
  {(inputProps) => <TextField {...inputProps} />}
</InputMask>

<InputMask mask="9999-99-99" value={v} onChange={onChange}>
  <TextField />
</InputMask>
```

Put `disabled` and `readOnly` on `InputMask`, not on the child.

### react-hook-form

```tsx
<InputMask mask="999-9999-9999" {...register('phone')} />

<Controller
  name="birth"
  control={control}
  render={({ field }) => <InputMask mask="9999-99-99" maskChar={null} {...field} />}
/>
```

### `useMask` hook

```tsx
import { useMask } from 'react-maskify';

function PhoneField() {
  const { inputProps, unmaskedValue } = useMask({ mask: '999-9999-9999', maskChar: null });
  return <input {...inputProps} inputMode="numeric" />;
}
```

### Utilities without React

```ts
import { formatWithMask, unmask, isComplete } from 'react-maskify';

formatWithMask('01012345678', '999-9999-9999'); // '010-1234-5678'
formatWithMask('0101', '999-9999-9999', { maskChar: '_' }); // '010-1___-____'
unmask('010-1234-5678', '999-9999-9999'); // '01012345678'
isComplete('010-1234-567', '999-9999-9999'); // false
```

## Korean presets

`react-maskify/presets` contains plain strings and functions only, so a bundler keeps just what you import
(importing `isValidBizNoKR` alone adds about 200 bytes).

```tsx
import InputMask from 'react-maskify';
import { phoneMaskKR, isValidBizNoKR, maskRRN, BIZ_NO_KR } from 'react-maskify/presets';

<InputMask mask={phoneMaskKR} maskChar={null} inputMode="numeric" />
<InputMask mask={BIZ_NO_KR} maskChar={null} />

isValidBizNoKR('220-81-62517'); // true
maskRRN('900101-1234567'); // '900101-1******'
```

| export | description |
| --- | --- |
| `phoneMaskKR(value)` | mask chosen from the digits: `02-123-4567`, `02-1234-5678`, `031-123-4567`, `010-1234-5678`, `1588-1234` |
| `landlineMaskKR` | same as `phoneMaskKR` |
| `formatPhoneKR(value)` | formats digits with the rules above |
| `MOBILE_KR` | `999-9999-9999` |
| `BIZ_NO_KR` | `999-99-99999` (business registration number) |
| `RRN_KR` | `999999-9999999` (resident registration number) |
| `CARD_KR` | `9999-9999-9999-9999` |
| `DATE_KR`, `DATE_DOT_KR` | `9999-99-99`, `9999.99.99` |
| `isValidMobileKR` | 010 with 11 digits, or 011/016/017/018/019 with 10-11 digits |
| `isValidLandlineKR` | 02, regional area codes, 070, 15xx/16xx/18xx |
| `isValidBizNoKR` | length and check digit |
| `isValidRRN(value, { checksum })` | length, birth date and gender digit; the legacy check digit only with `checksum: true`, because numbers issued since October 2020 do not use it |
| `maskRRN(value, { keep, char })` | hides the back part for display |
| `isValidCardNumber` | Luhn check, 13-19 digits |
| `isValidDateKR` | date that exists on the calendar |

The older `presets` object (`presets.phoneKR`, `presets.card`, ...) is still exported from `react-maskify`.

## Props

| prop | type | default | notes |
| --- | --- | --- | --- |
| `mask` | `string \| (string \| RegExp)[] \| (value) => mask` | | falsy renders a plain input |
| `maskChar` | `string \| null` | `'_'` | placeholder for empty slots, `null` hides them |
| `maskPlaceholder` | `string \| null` | | v3 name; one character, or one per mask position. Wins over `maskChar` |
| `formatChars` | `Record<string, string \| RegExp>` | `9`, `a`, `*` | replaces the defaults |
| `alwaysShowMask` | `boolean` | `false` | show the mask when empty and not focused |
| `beforeMaskedValueChange` | `(newState, oldState, userInput, maskOptions) => state` | | v2 hook; `maskOptions` also has `slots`: `(string \| RegExp)[]`, one per mask position |
| `beforeMaskedStateChange` | `({ previousState, currentState, nextState }) => state` | | v3 hook |
| `inputRef` | `Ref<HTMLInputElement>` | | v2 ref prop |
| `ref` | `Ref<HTMLInputElement>` | | the `<input>` element |
| `children` | `(props) => element` or element | | custom input |

Other props are passed to the `<input>`.

## Migrating from react-input-mask

react-input-mask 2.0.4 was published on 2018-09-01 (3.0.0-alpha.2 on 2020-01-21), and the repository is archived.
It calls `ReactDOM.findDOMNode`, which React 19 removed, so it fails with `findDOMNode is not a function`.

```bash
npm uninstall react-input-mask @types/react-input-mask
npm install react-maskify
npx react-maskify migrate src     # rewrites the imports; add --dry to preview
```

Before:

```tsx
import InputMask from 'react-input-mask';

<InputMask mask="99/99/9999" maskChar={null} value={value} onChange={onChange}>
  {(inputProps) => <TextField {...inputProps} />}
</InputMask>
```

After:

```tsx
import InputMask from 'react-maskify/compat';

<InputMask mask="99/99/9999" maskChar={null} value={value} onChange={onChange}>
  {(inputProps) => <TextField {...inputProps} />}
</InputMask>
```

| react-input-mask | react-maskify | status |
| --- | --- | --- |
| `import InputMask from 'react-input-mask'` | `import InputMask from 'react-maskify/compat'` | same component |
| `mask` string with `9`, `a`, `*`, `\` | same | same |
| `mask` array (v3) | same | same |
| `formatChars` (v2) | same | same |
| `maskChar` (v2) | same | same, default `'_'` |
| `maskPlaceholder` (v3) | same | single or full-length string |
| `alwaysShowMask` | same | same |
| `beforeMaskedValueChange` (v2) | same | `oldState.selection` is `null` |
| `beforeMaskedStateChange` (v3) | same | same |
| `children` function (v2) / element (v3) | same | both accepted |
| `inputRef` (v2) | `inputRef` or `ref` | points to the `<input>` |
| `ref` to class instance | `ref` to `<input>` | instance methods are not available |
| `@types/react-input-mask` | built in | `Props`, `InputState` types exported |

Behavior differences and more examples are in [docs/MIGRATION.md](./docs/MIGRATION.md).

## 한국어 안내

react-input-mask를 쓰던 코드는 import를 `react-maskify/compat`으로 바꾸면 그대로 동작합니다.
`npx react-maskify migrate src`로 import를 일괄 변경할 수 있습니다.

- React 17, 18, 19 지원. `findDOMNode`를 쓰지 않습니다.
- 한글 IME 조합 중에는 마스크를 적용하지 않고 조합이 끝난 뒤 적용합니다.
- `react-maskify/presets`에 휴대폰, 02 포함 지역번호, 사업자등록번호, 주민등록번호(뒷자리 가림), 카드번호, 날짜 마스크와 검증 함수가 있습니다.

```tsx
import InputMask from 'react-maskify';
import { phoneMaskKR, isValidMobileKR, maskRRN } from 'react-maskify/presets';

<InputMask mask={phoneMaskKR} maskChar={null} placeholder="010-0000-0000" />
isValidMobileKR('010-1234-5678'); // true
maskRRN('900101-1234567'); // '900101-1******'
```

## License

MIT © rjsgud49
