import { InputMask } from './InputMask';

export { InputMask };
export type { InputMaskProps } from './InputMask';
export { useMask } from './useMask';
export type {
  UseMaskOptions,
  UseMaskResult,
  MaskInputProps,
  MaskProp,
  BeforeMaskedValueChange,
  BeforeMaskedValueChangeConfig,
  BeforeMaskedStateChange,
} from './useMask';
export { formatWithMask, unmask, isComplete, parseMask, defaultFormatChars } from './core';
export type { FormatChars, MaskDefinition, MaskOptions, MaskedState, Selection, ParsedMask } from './core';
export { presets } from './presets/masks';
export type { PresetName } from './presets/masks';
export default InputMask;
