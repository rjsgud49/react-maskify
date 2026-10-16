# react-mask-input

[![npm](https://img.shields.io/npm/v/react-mask-input.svg)](https://www.npmjs.com/package/react-mask-input)
[![downloads](https://img.shields.io/npm/dw/react-mask-input.svg)](https://www.npmjs.com/package/react-mask-input)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-mask-input)](https://bundlephobia.com/package/react-mask-input)
[![types](https://img.shields.io/npm/types/react-mask-input.svg)](https://www.npmjs.com/package/react-mask-input)
[![license](https://img.shields.io/npm/l/react-mask-input.svg)](./LICENSE)

**A drop-in `react-input-mask` alternative for React 19.** No `findDOMNode`, zero dependencies, TypeScript-first, ~2.5 KB gzipped.

`react-input-mask` (last release 2.0.4, 2022) calls `ReactDOM.findDOMNode`, which **was removed in React 19**, so it crashes with
`TypeError: findDOMNode is not a function` / `react_dom.findDOMNode is not a function`.
`react-mask-input` keeps the same props, so the **findDOMNode fix is a one-line import change**.

```diff
- import InputMask from 'react-input-mask';
+ import InputMask from 'react-mask-input';
```

- ✅ React 17, 18, 19 (ref as a prop *and* `forwardRef`)
- ✅ Same API as `react-input-mask` v2 (+ v3 prop names)
- ✅ `useMask` hook and pure `formatWithMask` / `unmask` helpers
- ✅ Caret preserved on typing, backspace/delete in the middle, paste and selection replace
- ✅ IME / Korean, Japanese, Chinese composition safe
- ✅ SSR safe (Next.js, Remix), controlled & uncontrolled, react-hook-form friendly
- ✅ ESM + CJS + `.d.ts`, `sideEffects: false`, zero runtime deps

## Install

```bash
npm i react-mask-input
# or: pnpm add react-mask-input / yarn add react-mask-input
```

## Usage

```tsx
import InputMask, { presets } from 'react-mask-input';

<InputMask mask="999-9999-9999" placeholder="010-0000-0000" />
<InputMask mask={presets.card} maskChar={null} />
<InputMask mask="99/99/9999" alwaysShowMask />
```

### Mask syntax

| char | accepts |
| --- | --- |
| `9` | `[0-9]` |
| `a` | `[A-Za-z]` |
| `*` | `[A-Za-z0-9]` |
| `\\` | escapes the next char (`'+\\9 999'` → literal 9) |

Anything else is a literal. Custom definitions via `formatChars`:

```tsx
<InputMask mask="HH:HH" formatChars={{ H: '[0-9A-F]' }} />
```

Masks may also be arrays of literals and RegExps (`react-text-mask` style):

```tsx
<InputMask mask={['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/]} />
```

### Controlled

```tsx
const [phone, setPhone] = useState('');
<InputMask mask="999-9999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
```

`e.target.value` is already masked. Use `unmask(value, mask)` for the raw digits.

### Custom input (render prop)

```tsx
<InputMask mask="9999-99-99" value={v} onChange={onChange}>
  {(inputProps) => <MyTextField {...inputProps} />}
</InputMask>
```

### react-hook-form

```tsx
// register (uncontrolled)
<InputMask mask={presets.phoneKR} {...register('phone')} />

// Controller
<Controller name="birth" control={control}
  render={({ field }) => <InputMask mask={presets.dateISO} maskChar={null} {...field} />} />
```

### `useMask` hook

```tsx
import { useMask } from 'react-mask-input';

function PhoneField() {
  const { inputProps, unmaskedValue } = useMask({ mask: '999-9999-9999', maskChar: null });
  return <input {...inputProps} inputMode="numeric" />;
}
```

### Pure utilities (no React)

```ts
import { formatWithMask, unmask, isComplete } from 'react-mask-input';

formatWithMask('01012345678', '999-9999-9999'); // '010-1234-5678'
formatWithMask('0101', '999-9999-9999');        // '010-1'
formatWithMask('0101', '999-9999-9999', { maskChar: '_' }); // '010-1___-____'
unmask('010-1234-5678', '999-9999-9999');       // '01012345678'
isComplete('010-1234-567', '999-9999-9999');    // false
```

### Presets

`phoneKR` `999-9999-9999`, `phoneKRSeoul` `99-999-9999`, `phoneUS` `(999) 999-9999`, `phoneIntl`, `card`, `cardAmex`, `cardExpiry` `99/99`, `dateISO` `9999-99-99`, `date` `99/99/9999`, `dateKR` `9999.99.99`, `time` `99:99`, `zip`, `rrnKR`, `bizNoKR`.

## Props

| prop | type | default | |
| --- | --- | --- | --- |
| `mask` | `string \| (string\|RegExp)[]` | — | falsy → plain input |
| `maskChar` | `string \| null` | `'_'` | placeholder for empty slots, `null` hides them |
| `maskPlaceholder` | `string \| null` | — | v3 alias of `maskChar` (wins if set) |
| `formatChars` | `Record<string, string\|RegExp>` | `{9,a,*}` | replaces the defaults |
| `alwaysShowMask` | `boolean` | `false` | show mask when empty and unfocused |
| `beforeMaskedValueChange` | `(newState, oldState, userInput, maskOptions) => newState` | — | v2 hook |
| `beforeMaskedStateChange` | `({ previousState, currentState, nextState }) => state` | — | v3 hook |
| `inputRef` | `Ref<HTMLInputElement>` | — | legacy v2 ref |
| `ref` | `Ref<HTMLInputElement>` | — | real input element |
| `children` | `(props) => ReactElement` | — | render prop |

All other props go to the `<input>`.

## Migrating from react-input-mask

1. `npm remove react-input-mask @types/react-input-mask && npm i react-mask-input`
2. Replace the import. Done for most apps.

Differences, listed honestly:

- **Deleting shifts characters left.** In v2, deleting in the middle leaves a gap (`12_-45`). Here the following characters move left (`124-5_`), like most modern mask libraries. Typing in the middle also shifts characters right; characters pushed past the end are dropped.
- `ref` / `inputRef` point at the real `<input>`, not a class instance. v2's instance methods are not available.
- No `onChange` is fired on focus or blur just because the mask appears or disappears; the shown value is derived from focus.
- `beforeMaskedValueChange` gets `userInput = null`, and `oldState.selection` is `null`.
- `maskPlaceholder` takes only a single character (v3 accepted a full-length string).
- With render-prop `children`, put `disabled`/`readOnly` on `InputMask`, not the child (same as v2).
- The placeholder char must not be accepted by the mask rules (for example, don't use `0` with `9` slots).
- Dynamic masks (functions) and number/currency formatting are out of scope.

## 한국어

`react-mask-input`은 React 19에서 `findDOMNode` 제거로 동작하지 않는 `react-input-mask`를 **import 한 줄만 바꿔서** 대체할 수 있는 입력 마스크 라이브러리입니다.

- React 17 / 18 / 19 지원, 의존성 0개, gzip 약 2.5KB
- 휴대폰 번호(`presets.phoneKR` → `010-0000-0000`), 카드 번호, 날짜(`9999.99.99`), 사업자등록번호 등 프리셋 제공
- **한글 IME 조합 중에는 마스크를 적용하지 않고, 조합이 끝난 뒤 적용**해서 글자가 깨지거나 중복 입력되지 않습니다. 한글 슬롯은 `formatChars={{ X: '[가-힣]' }}`처럼 정의할 수 있습니다.
- 중간 삭제, 백스페이스, 붙여넣기, 범위 선택 후 입력에서도 커서 위치를 유지합니다.
- react-hook-form의 `register`와 `Controller` 모두 사용할 수 있습니다.

```tsx
import InputMask, { presets, unmask } from 'react-mask-input';

<InputMask mask={presets.phoneKR} maskChar={null} placeholder="010-0000-0000" />
unmask('010-1234-5678', presets.phoneKR); // '01012345678'
```

기존 `react-input-mask`와 다른 점은 위의 "Migrating" 항목을 참고하세요. 가장 큰 차이는 중간 삭제 시 뒤 글자들이 앞으로 당겨진다는 점입니다.

## License

MIT © rjsgud49
