import * as React from 'react';
import type { FormatChars } from './core';
import { useMask, type BeforeMaskedStateChange, type BeforeMaskedValueChange, type MaskProp } from './useMask';

type InputAttrs = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'>;

export interface InputMaskProps extends InputAttrs {
  /**
   * Mask string (`9` digit, `a` letter, `*` alphanumeric, `\\` escapes), array of literals/RegExps,
   * or a function `(value) => mask`. Falsy = plain input.
   */
  mask?: MaskProp | null;
  maskChar?: string | null;
  maskPlaceholder?: string | null;
  formatChars?: FormatChars;
  alwaysShowMask?: boolean;
  beforeMaskedValueChange?: BeforeMaskedValueChange;
  beforeMaskedStateChange?: BeforeMaskedStateChange;
  /** Legacy ref prop from react-input-mask v2. */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * v2 style: a function receiving the non-mask props, returning a single input-like element.
   * v3 style: a single element (e.g. `<MyInput />`); mask props are merged into it.
   */
  children?: ((props: InputAttrs) => React.ReactElement) | React.ReactElement;
  /** React 19 ref-as-prop (also works via forwardRef on 17/18). */
  ref?: React.Ref<HTMLInputElement>;
}

function setRef<T>(r: React.Ref<T> | undefined, v: T | null) {
  if (typeof r == 'function') r(v);
  else if (r) (r as React.MutableRefObject<T | null>).current = v;
}

const PASSTHRU = ['onChange', 'onFocus', 'onBlur', 'onKeyDown', 'onCompositionStart', 'onCompositionEnd'] as const;

const InputMaskInner = (props: InputMaskProps, fref: React.ForwardedRef<HTMLInputElement>) => {
  const {
    mask,
    maskChar,
    maskPlaceholder,
    formatChars,
    alwaysShowMask,
    beforeMaskedValueChange,
    beforeMaskedStateChange,
    inputRef,
    children,
    value,
    defaultValue,
    ...rest
  } = props;
  delete (rest as { ref?: unknown }).ref;
  const outer = fref || props.ref;
  const { inputProps: m } = useMask({
    mask: mask || '',
    maskChar,
    maskPlaceholder,
    formatChars,
    alwaysShowMask,
    beforeMaskedValueChange,
    beforeMaskedStateChange,
    value: value as string | undefined,
    defaultValue: defaultValue as string | undefined,
    onChange: rest.onChange,
    onFocus: rest.onFocus,
    onBlur: rest.onBlur,
    onKeyDown: rest.onKeyDown,
    onCompositionStart: rest.onCompositionStart,
    onCompositionEnd: rest.onCompositionEnd,
  });
  const ref = React.useCallback(
    (n: HTMLInputElement | null) => {
      m.ref(n);
      setRef(outer, n);
      setRef(inputRef, n);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outer, inputRef],
  );
  const renderChild = (pp: InputAttrs): React.ReactElement | null =>
    typeof children == 'function' ? children(pp) : React.isValidElement(children) ? React.cloneElement(children, pp) : null;
  if (!mask) {
    const el = renderChild(rest);
    const p = { ...rest, value, defaultValue, ref };
    return el ? React.cloneElement(el, p) : <input {...p} />;
  }
  const own = rest as Record<string, unknown>;
  PASSTHRU.forEach((k) => delete own[k]);
  const controlledProps = {
    value: m.value,
    onChange: m.onChange,
    onFocus: m.onFocus,
    onBlur: m.onBlur,
    onKeyDown: m.onKeyDown,
    onCompositionStart: m.onCompositionStart,
    onCompositionEnd: m.onCompositionEnd,
    disabled: rest.disabled,
    readOnly: rest.readOnly,
    ref,
  };
  if (children != null) {
    const { disabled: _d, readOnly: _r, ...childProps } = rest;
    const el = renderChild(childProps);
    if (el) return React.cloneElement(el, controlledProps);
  }
  return <input {...rest} {...controlledProps} />;
};

/** Drop-in, React 19 compatible replacement for `react-input-mask`'s default export. */
export const InputMask = React.forwardRef(InputMaskInner) as unknown as (
  props: InputMaskProps,
) => React.ReactElement;
(InputMask as { displayName?: string }).displayName = 'InputMask';
