export type FormatChars = Record<string, string | RegExp>;
export type MaskDefinition = string | ReadonlyArray<string | RegExp>;

export interface MaskOptions {
  /** Placeholder for unfilled editable slots. `null` hides unfilled slots. */
  maskChar?: string | null;
  /** Map of mask characters to the pattern they accept. */
  formatChars?: FormatChars;
}

/** A single position of a mask: either a fixed literal or an editable slot. */
export type Slot = string | RegExp;

export interface ParsedMask {
  slots: Slot[];
  maskChar: string | null;
}

export const defaultFormatChars: FormatChars = {
  '9': '[0-9]',
  a: '[A-Za-z]',
  '*': '[A-Za-z0-9]',
};

const toRe = (p: string | RegExp): RegExp => (typeof p == 'string' ? new RegExp('^(?:' + p + ')$') : p);

const cache = new Map<string, ParsedMask>();

/** Parse a mask into slots. Supports `\\` escaping in string masks and arrays of strings/RegExps. */
export function parseMask(mask: MaskDefinition, options: MaskOptions = {}): ParsedMask {
  const maskChar = options.maskChar === undefined ? '_' : options.maskChar || null;
  const fc = options.formatChars;
  const key = typeof mask == 'string' && !fc ? mask + '\0' + maskChar : '';
  const hit = key && cache.get(key);
  if (hit) return hit;
  const chars = fc || defaultFormatChars;
  const slots: Slot[] = [];
  if (typeof mask == 'string') {
    let esc = false;
    for (const ch of mask) {
      if (!esc && ch == '\\') esc = true;
      else {
        slots.push(!esc && chars[ch] ? toRe(chars[ch]) : ch);
        esc = false;
      }
    }
  } else {
    for (const s of mask) {
      if (typeof s == 'string') slots.push(...s.split(''));
      else slots.push(s);
    }
  }
  const parsed = { slots, maskChar: maskChar ? maskChar[0] : null };
  if (key) cache.set(key, parsed);
  return parsed;
}

const editable = (s: Slot | undefined): s is RegExp => s instanceof RegExp;

/**
 * Feed `input` through the mask starting at slot `from`, matching typed literals
 * and dropping characters that don't fit. Returns the accepted editable characters.
 */
export function conform(p: ParsedMask, input: string, from = 0, limit = Infinity): string {
  const { slots } = p;
  let out = '';
  let i = from;
  for (const ch of input) {
    if (out.length >= limit) break;
    while (i < slots.length && !editable(slots[i]) && slots[i] != ch) i++;
    const s = slots[i];
    if (s === undefined) break;
    if (!editable(s)) {
      i++;
      continue;
    }
    s.lastIndex = 0;
    if (s.test(ch)) {
      out += ch;
      i++;
    }
  }
  return out;
}

/** Fill raw (unmasked) characters into the editable slots, revalidating each. */
function fill(p: ParsedMask, raw: string): string {
  let out = '';
  let k = 0;
  for (const s of p.slots) {
    if (!editable(s)) continue;
    while (k < raw.length && !(s.lastIndex = 0, s.test(raw[k]))) k++;
    if (k >= raw.length) break;
    out += raw[k++];
  }
  return out;
}

/** Render raw characters into a masked string. */
export function render(p: ParsedMask, raw: string, show = true): string {
  if (!raw && !show) return '';
  let out = '';
  let k = 0;
  for (const s of p.slots) {
    if (editable(s)) {
      if (k < raw.length) out += raw[k++];
      else if (p.maskChar) out += p.maskChar;
      else break;
    } else out += s;
  }
  return out;
}

/** Index in the masked string of the k-th editable slot (or the end). */
export function caretFor(p: ParsedMask, k: number): number {
  let n = 0;
  for (let i = 0; i < p.slots.length; i++) if (editable(p.slots[i]) && n++ == k) return i;
  return p.slots.length;
}

/** Number of editable slots. */
export const capacity = (p: ParsedMask): number => p.slots.filter(editable).length;

export interface Selection {
  start: number;
  end: number;
}
export interface MaskedState {
  value: string;
  selection: Selection | null;
}

/**
 * Compute the next masked value and caret from a native edit.
 * `prev` is the masked value before the edit, `next` the raw DOM value after it,
 * `caret` the DOM caret after it, `backward` whether a pure deletion was a backspace.
 */
export function applyEdit(
  p: ParsedMask,
  prev: string,
  next: string,
  caret: number,
  backward = true,
): { value: string; caret: number; raw: string } {
  let prevEnd = prev.length - (next.length - caret);
  if (prevEnd < 0 || next.slice(caret) !== prev.slice(prevEnd)) {
    // fall back to plain diff
    let s = 0;
    while (s < prev.length && s < next.length && prev[s] == next[s]) s++;
    let e = 0;
    while (e < prev.length - s && e < next.length - s && prev[prev.length - 1 - e] == next[next.length - 1 - e]) e++;
    prevEnd = prev.length - e;
    caret = next.length - e;
  }
  let start = 0;
  const lim = Math.min(caret, prevEnd);
  while (start < lim && prev[start] == next[start]) start++;
  const inserted = next.slice(start, caret);
  const rawPrev = conform(p, prev);
  let rs = conform(p, prev.slice(0, start)).length;
  let re = conform(p, prev.slice(0, prevEnd)).length;
  if (!inserted && rs == re && prevEnd > start) {
    if (backward) rs = Math.max(0, rs - 1);
    else re = Math.min(rawPrev.length, re + 1);
  }
  const head = rawPrev.slice(0, rs);
  const cap = capacity(p);
  const from = rs ? caretFor(p, rs - 1) + 1 : 0;
  const ins = conform(p, inserted, from, cap - rs);
  const raw = fill(p, head + ins + rawPrev.slice(re)).slice(0, cap);
  const value = render(p, raw);
  const k = rs + ins.length;
  return { value, raw, caret: Math.min(k >= cap ? value.length : caretFor(p, k), value.length) };
}

/** Format any string (raw or partially masked) with a mask. Hides unfilled slots by default. */
export function formatWithMask(value: string, mask: MaskDefinition, options: MaskOptions = {}): string {
  const p = parseMask(mask, { maskChar: null, ...options });
  return render(p, conform(p, value), false);
}

/** Extract only the user-entered characters from a (masked) string. */
export function unmask(value: string, mask: MaskDefinition, options: MaskOptions = {}): string {
  return conform(parseMask(mask, options), value);
}

/** Whether every editable slot of the mask is filled. */
export function isComplete(value: string, mask: MaskDefinition, options: MaskOptions = {}): boolean {
  const p = parseMask(mask, options);
  return conform(p, value).length == capacity(p);
}
