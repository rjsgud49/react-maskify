/**
 * Korean masks, formatters and validators.
 * Every export is a plain function or string, so unused ones are removed by bundlers.
 */

const digits = (v: string): string => v.replace(/\D/g, '');

/** Mobile phone: 010-1234-5678 */
export const MOBILE_KR = '999-9999-9999';
/** Business registration number (사업자등록번호): 123-45-67890 */
export const BIZ_NO_KR = '999-99-99999';
/** Resident registration number (주민등록번호): 900101-1234567 */
export const RRN_KR = '999999-9999999';
/** Card number: 1234-5678-9012-3456 */
export const CARD_KR = '9999-9999-9999-9999';
/** Date: 2026-10-21 */
export const DATE_KR = '9999-99-99';
/** Date with dots: 2026.10.21 */
export const DATE_DOT_KR = '9999.99.99';

/**
 * Picks a phone mask from the digits typed so far. Pass it as a function mask:
 * `<InputMask mask={phoneMaskKR} maskChar={null} />`.
 *
 * - 02 (Seoul): 02-123-4567, 02-1234-5678
 * - 15xx/16xx/18xx: 1588-1234
 * - 010, 031, 070 and other 3-digit prefixes: 031-123-4567, 010-1234-5678
 */
export function phoneMaskKR(value: string): string {
  const d = digits(value);
  if (d.startsWith('02')) return d.length > 9 ? '99-9999-9999' : '99-999-9999';
  if (/^1[5-9]/.test(d)) return '9999-9999';
  return d.length > 10 ? '999-9999-9999' : '999-999-9999';
}

/** Landline mask chooser; same rules as {@link phoneMaskKR}. */
export const landlineMaskKR = phoneMaskKR;

/** Format any string of digits as a Korean phone number: `formatPhoneKR('0212345678')` → `'02-1234-5678'`. */
export function formatPhoneKR(value: string): string {
  const d = digits(value);
  const m = phoneMaskKR(d);
  let out = '';
  let k = 0;
  for (const ch of m) {
    if (k >= d.length) break;
    out += ch == '9' ? d[k++] : ch;
  }
  return out;
}

/** 010 mobile number with 11 digits (01X with 10 or 11 digits for older numbers). */
export function isValidMobileKR(value: string): boolean {
  const d = digits(value);
  return /^010\d{8}$/.test(d) || /^01[16789]\d{7,8}$/.test(d);
}

const AREA = ['031', '032', '033', '041', '042', '043', '044', '051', '052', '053', '054', '055', '061', '062', '063', '064', '070'];

/** Landline: 02 + 7-8 digits, a 3-digit area code (or 070) + 7-8 digits, or 15xx/16xx/18xx + 4 digits. */
export function isValidLandlineKR(value: string): boolean {
  const d = digits(value);
  if (/^02\d{7,8}$/.test(d)) return true;
  if (/^1[5-9]\d{6}$/.test(d)) return true;
  return AREA.includes(d.slice(0, 3)) && /^\d{10,11}$/.test(d);
}

/** Business registration number checksum (국세청 검증 규칙). */
export function isValidBizNoKR(value: string): boolean {
  const d = digits(value);
  if (d.length != 10) return false;
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * w[i];
  sum += Math.floor((Number(d[8]) * 5) / 10);
  return (10 - (sum % 10)) % 10 == Number(d[9]);
}

export interface RrnOptions {
  /**
   * Check the last digit with the legacy checksum. Numbers issued since October 2020
   * no longer follow it, so this is off by default.
   */
  checksum?: boolean;
}

/** Resident registration number: 13 digits, a real birth date and a valid gender digit (1-8). */
export function isValidRRN(value: string, options: RrnOptions = {}): boolean {
  const d = digits(value);
  if (d.length != 13) return false;
  const g = Number(d[6]);
  if (g < 1 || g > 8) return false;
  const century = [1900, 1900, 2000, 2000, 1900, 1900, 2000, 2000][g - 1];
  const y = century + Number(d.slice(0, 2));
  if (!isValidDateParts(y, Number(d.slice(2, 4)), Number(d.slice(4, 6)))) return false;
  if (options.checksum) {
    const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(d[i]) * w[i];
    if ((11 - (sum % 11)) % 10 != Number(d[12])) return false;
  }
  return true;
}

/**
 * Hide the back part of a resident registration number for display.
 * `maskRRN('900101-1234567')` → `'900101-1******'`. Pass `keep: 0` to hide the gender digit too.
 */
export function maskRRN(value: string, options: { keep?: number; char?: string } = {}): string {
  const { keep = 1, char = '*' } = options;
  const d = digits(value).slice(0, 13);
  if (d.length <= 6) return d;
  const back = d.slice(6);
  return d.slice(0, 6) + '-' + back.slice(0, keep) + char.repeat(Math.max(0, back.length - keep));
}

/** Card number Luhn check (13-19 digits). */
export function isValidCardNumber(value: string): boolean {
  const d = digits(value);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 == 0;
}

function isValidDateParts(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() == y && dt.getUTCMonth() == m - 1 && dt.getUTCDate() == d;
}

/** Date in YYYY-MM-DD, YYYY.MM.DD or YYYYMMDD form that exists on the calendar. */
export function isValidDateKR(value: string): boolean {
  const d = digits(value);
  if (d.length != 8) return false;
  return isValidDateParts(Number(d.slice(0, 4)), Number(d.slice(4, 6)), Number(d.slice(6, 8)));
}
