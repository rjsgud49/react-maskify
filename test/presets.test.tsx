import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputMask from '../src/compat';
import {
  BIZ_NO_KR,
  CARD_KR,
  DATE_KR,
  MOBILE_KR,
  RRN_KR,
  formatPhoneKR,
  isValidBizNoKR,
  isValidCardNumber,
  isValidDateKR,
  isValidLandlineKR,
  isValidMobileKR,
  isValidRRN,
  maskRRN,
  phoneMaskKR,
  presets,
} from '../src/presets';
import { formatWithMask } from '../src';

const get = () => screen.getByRole('textbox') as HTMLInputElement;

describe('Korean masks', () => {
  it.each([
    [MOBILE_KR, '01012345678', '010-1234-5678'],
    [BIZ_NO_KR, '1234567890', '123-45-67890'],
    [RRN_KR, '9001011234567', '900101-1234567'],
    [CARD_KR, '1234567812345678', '1234-5678-1234-5678'],
    [DATE_KR, '20261021', '2026-10-21'],
  ])('%s formats %s', (mask, raw, out) => {
    expect(formatWithMask(raw, mask)).toBe(out);
  });

  it('legacy presets object is still exported', () => {
    expect(presets.phoneKR).toBe('999-9999-9999');
  });
});

describe('phoneMaskKR', () => {
  it.each([
    ['0212345678', '02-1234-5678'],
    ['021234567', '02-123-4567'],
    ['0311234567', '031-123-4567'],
    ['03112345678', '031-1234-5678'],
    ['01012345678', '010-1234-5678'],
    ['15881234', '1588-1234'],
    ['07012345678', '070-1234-5678'],
  ])('formatPhoneKR(%s) = %s', (raw, out) => {
    expect(formatPhoneKR(raw)).toBe(out);
  });

  it('typing into a function mask switches 02-123-4567 to 02-1234-5678', async () => {
    render(<InputMask mask={phoneMaskKR} maskChar={null} />);
    const u = userEvent.setup();
    await u.type(get(), '021234567');
    expect(get().value).toBe('02-123-4567');
    await u.type(get(), '8');
    expect(get().value).toBe('02-1234-5678');
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('02-123-4567');
  });

  it('typing a mobile number', async () => {
    render(<InputMask mask={phoneMaskKR} maskChar={null} />);
    await userEvent.setup().type(get(), '01098765432');
    expect(get().value).toBe('010-9876-5432');
  });

  it('pasting a landline number', async () => {
    render(<InputMask mask={phoneMaskKR} maskChar={null} />);
    const u = userEvent.setup();
    await u.click(get());
    await u.paste('031-123-4567');
    expect(get().value).toBe('031-123-4567');
  });
});

describe('validators', () => {
  it('mobile', () => {
    expect(isValidMobileKR('010-1234-5678')).toBe(true);
    expect(isValidMobileKR('011-123-4567')).toBe(true);
    expect(isValidMobileKR('010-123-4567')).toBe(false);
    expect(isValidMobileKR('02-1234-5678')).toBe(false);
  });

  it('landline', () => {
    expect(isValidLandlineKR('02-123-4567')).toBe(true);
    expect(isValidLandlineKR('02-1234-5678')).toBe(true);
    expect(isValidLandlineKR('031-123-4567')).toBe(true);
    expect(isValidLandlineKR('1588-1234')).toBe(true);
    expect(isValidLandlineKR('099-123-4567')).toBe(false);
    expect(isValidLandlineKR('02-12-345')).toBe(false);
  });

  it('business registration number checksum', () => {
    expect(isValidBizNoKR('220-81-62517')).toBe(true);
    expect(isValidBizNoKR('2208162517')).toBe(true);
    expect(isValidBizNoKR('220-81-62518')).toBe(false);
    expect(isValidBizNoKR('220-81-6251')).toBe(false);
  });

  it('resident registration number', () => {
    expect(isValidRRN('900101-1234567')).toBe(true);
    expect(isValidRRN('000229-3234567')).toBe(true); // 2000 is a leap year
    expect(isValidRRN('010229-3234567')).toBe(false);
    expect(isValidRRN('901301-1234567')).toBe(false);
    expect(isValidRRN('900101-9234567')).toBe(false);
    expect(isValidRRN('900101-123456')).toBe(false);
    expect(isValidRRN('900101-1234568', { checksum: true })).toBe(true);
    expect(isValidRRN('900101-1234567', { checksum: true })).toBe(false);
  });

  it('maskRRN', () => {
    expect(maskRRN('900101-1234567')).toBe('900101-1******');
    expect(maskRRN('9001011234567', { keep: 0 })).toBe('900101-*******');
    expect(maskRRN('900101-12')).toBe('900101-1*');
    expect(maskRRN('9001')).toBe('9001');
  });

  it('card number (Luhn)', () => {
    expect(isValidCardNumber('4111-1111-1111-1111')).toBe(true);
    expect(isValidCardNumber('4111-1111-1111-1112')).toBe(false);
    expect(isValidCardNumber('4111')).toBe(false);
  });

  it('date', () => {
    expect(isValidDateKR('2026-10-21')).toBe(true);
    expect(isValidDateKR('2024.02.29')).toBe(true);
    expect(isValidDateKR('2025-02-29')).toBe(false);
    expect(isValidDateKR('2026-13-01')).toBe(false);
    expect(isValidDateKR('2026-10')).toBe(false);
  });
});
