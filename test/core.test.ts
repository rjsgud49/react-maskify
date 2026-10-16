import { formatWithMask, unmask, isComplete, parseMask } from '../src';
import { applyEdit } from '../src/core';

describe('formatWithMask / unmask', () => {
  it('formats raw digits', () => {
    expect(formatWithMask('01012345678', '999-9999-9999')).toBe('010-1234-5678');
  });
  it('formats partial values and appends next literal', () => {
    expect(formatWithMask('010', '999-9999-9999')).toBe('010-');
    expect(formatWithMask('0101', '999-9999-9999')).toBe('010-1');
  });
  it('supports placeholders', () => {
    expect(formatWithMask('0101', '999-9999-9999', { maskChar: '_' })).toBe('010-1___-____');
  });
  it('is idempotent on masked input', () => {
    expect(formatWithMask('010-1234-5678', '999-9999-9999')).toBe('010-1234-5678');
  });
  it('drops invalid characters', () => {
    expect(formatWithMask('a1b2', '99')).toBe('12');
  });
  it('custom formatChars, letters and escapes', () => {
    expect(formatWithMask('ab12', 'aa-99')).toBe('ab-12');
    expect(formatWithMask('5', '\\9 9')).toBe('9 5');
    expect(formatWithMask('가나', 'XX', { formatChars: { X: '[가-힣]' } })).toBe('가나');
  });
  it('array masks with RegExp', () => {
    expect(formatWithMask('123', ['(', /\d/, /\d/, ')', ' ', /\d/])).toBe('(12) 3');
  });
  it('unmask and isComplete', () => {
    expect(unmask('010-1234-5678', '999-9999-9999')).toBe('01012345678');
    expect(unmask('010-1___-____', '999-9999-9999')).toBe('0101');
    expect(isComplete('010-1234-5678', '999-9999-9999')).toBe(true);
    expect(isComplete('010-1234-567', '999-9999-9999')).toBe(false);
  });
  it('prefix masks', () => {
    expect(formatWithMask('9123456789', '+7 (999) 999-99-99')).toBe('+7 (912) 345-67-89');
  });
});

describe('applyEdit', () => {
  const p = parseMask('999-9999-9999');
  it('backspace over a literal removes the previous digit', () => {
    const r = applyEdit(p, '010-1___-____', '0101___-____', 3, true);
    expect(r.value).toBe('011-____-____');
    expect(r.caret).toBe(2);
  });
  it('forward delete over a literal removes the next digit', () => {
    const r = applyEdit(p, '010-12__-____', '0101-2__-____'.replace('1-', '1') /* simulate */, 3, false);
    expect(r.raw).toBe('0102');
  });
  it('middle insertion shifts', () => {
    const r = applyEdit(p, '010-12__-____', '0103-12__-____', 4);
    expect(r.value).toBe('010-312_-____');
    expect(r.caret).toBe(5);
  });
});
