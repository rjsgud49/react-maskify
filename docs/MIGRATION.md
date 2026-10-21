# Migrating from react-input-mask

This guide covers moving from `react-input-mask` 2.x (and 3.0.0 alpha) to `react-maskify`.

## Why

- The last stable release, 2.0.4, was published on 2018-09-01. The repository (sanniassin/react-input-mask) is archived.
- It uses `ReactDOM.findDOMNode`. React 19 removed that API, so the component throws
  `findDOMNode is not a function`. On React 18 StrictMode it logs a deprecation warning.

## Steps

1. Replace the package:

   ```bash
   npm uninstall react-input-mask @types/react-input-mask
   npm install react-maskify
   ```

2. Change the imports. Either by hand:

   ```diff
   - import InputMask from 'react-input-mask';
   + import InputMask from 'react-maskify/compat';
   ```

   or with the codemod:

   ```bash
   npx react-maskify migrate src          # writes the changes
   npx react-maskify migrate src --dry    # only lists files
   ```

   The codemod rewrites the module name in `import`, `export ... from`, `import()`, `require()`,
   `jest.mock()` and `vi.mock()`. It does not touch comments or other strings, and skips
   `node_modules`, `dist`, `build`, `.next` and `coverage`. Running it twice is safe.

3. Run your tests. Check the differences listed below.

`react-maskify/compat` and the default export of `react-maskify` are the same component.
The compat entry also exports the type names from `@types/react-input-mask` (`Props`, `InputState`).

## API mapping

| react-input-mask | react-maskify | notes |
| --- | --- | --- |
| `mask="99/99/9999"` | same | `9` digit, `a` letter, `*` letter or digit |
| `mask={'+\\9 999'}` | same | backslash makes the next character a literal |
| `mask={['(', /\d/, ')']}` (v3) | same | |
| `formatChars={{ ... }}` (v2) | same | replaces the defaults, like v2 |
| `maskChar="_"` / `maskChar={null}` (v2) | same | default `'_'` |
| `maskPlaceholder` (v3) | same | single character, or a string as long as the mask (`dd/mm/yyyy`) |
| `alwaysShowMask` | same | |
| `beforeMaskedValueChange(newState, oldState, userInput, maskOptions)` (v2) | same | `maskOptions` has `mask`, `maskChar`, `permanents`, `formatChars`, `alwaysShowMask`; `oldState.selection` is `null` |
| `beforeMaskedStateChange({ previousState, currentState, nextState })` (v3) | same | |
| `children={(props) => <Input {...props} />}` (v2) | same | |
| `children={<Input />}` (v3) | same | |
| `inputRef` (v2) | same, or `ref` | both receive the `<input>` element |
| `ref` (class instance) | `ref` (`<input>` element) | no instance methods |
| not available | `mask={(value) => mask}` | pick the mask from the current value |
| not available | `useMask()` | headless hook |

## Examples

### Phone number

Before:

```tsx
import InputMask from 'react-input-mask';

<InputMask mask="+7 (999) 999-99-99" value={phone} onChange={(e) => setPhone(e.target.value)} />
```

After:

```tsx
import InputMask from 'react-maskify/compat';

<InputMask mask="+7 (999) 999-99-99" value={phone} onChange={(e) => setPhone(e.target.value)} />
```

### Material UI TextField

Before:

```tsx
import InputMask from 'react-input-mask';
import TextField from '@mui/material/TextField';

<InputMask mask="9999-99-99" value={value} onChange={onChange} disabled={disabled}>
  {(inputProps) => <TextField {...inputProps} label="Date" />}
</InputMask>
```

After:

```tsx
import InputMask from 'react-maskify/compat';
import TextField from '@mui/material/TextField';

<InputMask mask="9999-99-99" value={value} onChange={onChange} disabled={disabled}>
  {(inputProps) => <TextField {...inputProps} label="Date" />}
</InputMask>
```

### Optional trailing character (v2 README example)

```tsx
import InputMask, { type InputState } from 'react-maskify/compat';

function beforeMaskedValueChange(newState: InputState, oldState: InputState, userInput: string | null) {
  let { value, selection } = newState;
  if (value.endsWith('-') && userInput !== '-') {
    value = value.slice(0, -1);
    if (selection && selection.start === value.length + 1) selection = { start: value.length, end: value.length };
  }
  return { value, selection };
}

<InputMask mask="99999-9999" maskChar={null} beforeMaskedValueChange={beforeMaskedValueChange} />
```

### Korean phone numbers with different lengths

react-input-mask needed a `beforeMaskedValueChange` workaround or a mask swap in state.
Here a function mask does it:

```tsx
import InputMask from 'react-maskify/compat';
import { phoneMaskKR } from 'react-maskify/presets';

<InputMask mask={phoneMaskKR} maskChar={null} />
// 021234567 -> 02-123-4567, 0212345678 -> 02-1234-5678, 01012345678 -> 010-1234-5678
```

## Behavior differences

- Deleting in the middle moves the following characters left (`123-45` → backspace after `2` → `134-5_`).
  react-input-mask v2 leaves a placeholder in the deleted slot. Typing in the middle moves characters right;
  characters pushed past the end are dropped.
- `ref` and `inputRef` give the `<input>` element. Code that called methods on the react-input-mask instance needs to use the element instead.
- `onChange` is not fired on focus or blur when the placeholder appears or disappears. The shown value comes from the focus state.
- `oldState.selection` in `beforeMaskedValueChange` is `null`.
- The placeholder character must not be accepted by the mask rule at that position (for example, `0` with `9` slots).
- Number and currency formatting are not covered. Use react-number-format for those.

If something behaves differently from react-input-mask and is not listed here, please open an issue with the mask, the keys pressed and the expected value.
