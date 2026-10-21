/**
 * Drop-in entry for code written against react-input-mask (v2 or v3).
 * Migrating means changing `from 'react-input-mask'` to `from 'react-maskify/compat'`.
 */
import { InputMask } from './InputMask';

export type { InputMaskProps, InputMaskProps as Props } from './InputMask';
export type {
  BeforeMaskedValueChange,
  BeforeMaskedValueChangeConfig,
  BeforeMaskedStateChange,
  MaskProp,
} from './useMask';
export type { MaskedState as InputState, MaskedState, Selection } from './core';
export { InputMask };
export default InputMask;
