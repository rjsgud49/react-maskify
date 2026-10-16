import * as React from 'react';
import {
  applyEdit,
  caretFor,
  conform,
  parseMask,
  render,
  type FormatChars,
  type MaskDefinition,
  type MaskedState,
  type ParsedMask,
} from './core';

/** v2-style hook: `(newState, oldState, userInput, maskOptions) => newState` */
export type BeforeMaskedValueChange = (
  newState: MaskedState,
  oldState: MaskedState,
  userInput: string | null,
  maskOptions: ParsedMask,
) => MaskedState;

/** v3-style hook */
export type BeforeMaskedStateChange = (states: {
  previousState: MaskedState;
  currentState: MaskedState;
  nextState: MaskedState;
}) => MaskedState;

export interface UseMaskOptions {
  mask: MaskDefinition;
  /** Placeholder for unfilled slots (react-input-mask v2 name). Default `'_'`; `null` to hide. */
  maskChar?: string | null;
  /** Alias of `maskChar` (react-input-mask v3 name). Takes precedence when set. */
  maskPlaceholder?: string | null;
  formatChars?: FormatChars;
  alwaysShowMask?: boolean;
  value?: string | number | readonly string[] | null;
  defaultValue?: string | number | readonly string[] | null;
  beforeMaskedValueChange?: BeforeMaskedValueChange;
  beforeMaskedStateChange?: BeforeMaskedStateChange;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onCompositionStart?: React.CompositionEventHandler<HTMLInputElement>;
  onCompositionEnd?: React.CompositionEventHandler<HTMLInputElement>;
}

export interface MaskInputProps {
  /** Attach to the `<input>` element. */
  ref: React.RefCallback<HTMLInputElement>;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onCompositionStart: React.CompositionEventHandler<HTMLInputElement>;
  onCompositionEnd: React.CompositionEventHandler<HTMLInputElement>;
}

export interface UseMaskResult {
  /** Spread onto the `<input>`: `<input {...inputProps} />` */
  inputProps: MaskInputProps;
  /** Current displayed (masked) value. */
  value: string;
  /** Only the user-entered characters. */
  unmaskedValue: string;
  /** The current input element. */
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}

const useIsoLayoutEffect = typeof window != 'undefined' ? React.useLayoutEffect : React.useEffect;
const str = (v: unknown): string => (v == null ? '' : Array.isArray(v) ? v.join('') : String(v));

/** Headless masking hook. Spread the returned props onto an `<input>`. */
export function useMask(o: UseMaskOptions): UseMaskResult {
  const p = parseMask(o.mask, {
    maskChar: o.maskPlaceholder !== undefined ? o.maskPlaceholder : o.maskChar,
    formatChars: o.formatChars,
  });
  const controlled = o.value !== undefined;
  const [inner, setInner] = React.useState(() => str(o.defaultValue));
  const [focused, setFocused] = React.useState(false);
  const [composing, setComposing] = React.useState<string | null>(null);
  const el = React.useRef<HTMLInputElement | null>(null);
  const pending = React.useRef<number | null>(null);
  const backward = React.useRef(true);
  const snap = React.useRef('');

  const raw = conform(p, controlled ? str(o.value) : inner);
  const display = render(p, raw, focused || !!o.alwaysShowMask);
  const shown = React.useRef(display);
  if (composing === null) shown.current = display;

  const setSel = (c: number) => {
    const i = el.current;
    if (i && i.ownerDocument.activeElement === i) i.setSelectionRange(c, c);
  };

  useIsoLayoutEffect(() => {
    if (pending.current != null) {
      setSel(pending.current);
      pending.current = null;
    }
  });

  const commit = (e: React.SyntheticEvent<HTMLInputElement>, prev: string) => {
    const i = e.currentTarget;
    const next = i.value;
    const c = i.selectionEnd == null ? next.length : i.selectionEnd;
    const r = applyEdit(p, prev, next, c, backward.current);
    let state: MaskedState = { value: r.value, selection: { start: r.caret, end: r.caret } };
    const old: MaskedState = { value: prev, selection: null };
    if (o.beforeMaskedValueChange) state = o.beforeMaskedValueChange(state, old, null, p);
    if (o.beforeMaskedStateChange)
      state = o.beforeMaskedStateChange({
        previousState: old,
        currentState: { value: next, selection: { start: c, end: c } },
        nextState: state,
      });
    const v = state.value;
    const caret = state.selection ? state.selection.end : v.length;
    i.value = v;
    setSel(caret);
    pending.current = caret;
    shown.current = v;
    if (!controlled) setInner(v);
    if (v !== prev) o.onChange?.(e as React.ChangeEvent<HTMLInputElement>);
  };

  const ref = React.useCallback((n: HTMLInputElement | null) => {
    el.current = n;
  }, []);
  const inputProps: MaskInputProps = {
    ref,
    value: composing !== null ? composing : display,
    onChange(e) {
      if (composing !== null) {
        setComposing(e.currentTarget.value);
        return;
      }
      commit(e, shown.current);
      backward.current = true;
    },
    onKeyDown(e) {
      backward.current = e.key != 'Delete';
      o.onKeyDown?.(e);
    },
    onFocus(e) {
      setFocused(true);
      const i = e.currentTarget;
      const fillAt = (r: string) => Math.min(caretFor(p, r.length), render(p, r).length);
      if (!raw && p.maskChar && !o.alwaysShowMask) pending.current = fillAt(raw);
      const v0 = i.value;
      setTimeout(() => {
        // Recompute from the live value: the user may already have typed since focus.
        if (i.ownerDocument.activeElement !== i || i.value !== v0 && i.value !== render(p, raw)) return;
        const fillPos = fillAt(conform(p, i.value));
        if (i.selectionStart === i.selectionEnd && (i.selectionEnd || 0) > fillPos) setSel(fillPos);
      });
      o.onFocus?.(e);
    },
    onBlur(e) {
      setFocused(false);
      o.onBlur?.(e);
    },
    onCompositionStart(e) {
      snap.current = shown.current;
      setComposing(e.currentTarget.value);
      o.onCompositionStart?.(e);
    },
    onCompositionEnd(e) {
      setComposing(null);
      commit(e, snap.current);
      o.onCompositionEnd?.(e);
    },
  };
  return { inputProps, value: display, unmaskedValue: raw, inputRef: el };
}
