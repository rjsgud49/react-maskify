/** Ready-made masks. */
export const presets = {
  /** Korean mobile: 010-1234-5678 */
  phoneKR: '999-9999-9999',
  /** Korean landline (Seoul 02): 02-123-4567 */
  phoneKRSeoul: '99-999-9999',
  /** US phone: (555) 123-4567 */
  phoneUS: '(999) 999-9999',
  /** International E.164-ish: +1 555 123 4567 */
  phoneIntl: '+9 999 999 9999',
  /** 16-digit card number */
  card: '9999 9999 9999 9999',
  /** Amex 15-digit card */
  cardAmex: '9999 999999 99999',
  /** Card expiry MM/YY */
  cardExpiry: '99/99',
  /** ISO date YYYY-MM-DD */
  dateISO: '9999-99-99',
  /** Date DD/MM/YYYY or MM/DD/YYYY */
  date: '99/99/9999',
  /** Korean date YYYY.MM.DD */
  dateKR: '9999.99.99',
  /** Time HH:MM */
  time: '99:99',
  /** Korean resident registration number: 900101-1234567 */
  rrnKR: '999999-9999999',
  /** Korean business registration number: 123-45-67890 */
  bizNoKR: '999-99-99999',
  /** US ZIP+4 */
  zip: '99999-9999',
} as const;

export type PresetName = keyof typeof presets;
