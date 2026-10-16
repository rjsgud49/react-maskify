import { InputMask } from './InputMask';

export { InputMask };
export type { InputMaskProps } from './InputMask';
export { useMask } from './useMask';
export type { UseMaskOptions, UseMaskResult, MaskInputProps, BeforeMaskedValueChange, BeforeMaskedStateChange } from './useMask';
export { formatWithMask, unmask, isComplete, parseMask, defaultFormatChars } from './core';
export type { FormatChars, MaskDefinition, MaskOptions, MaskedState, Selection, ParsedMask } from './core';
export { presets } from './presets';
export type { PresetName } from './presets';
export default InputMask;
