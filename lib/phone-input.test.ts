import { describe, expect, it } from 'vitest';
import { normalizeIndonesianPhoneInput } from './utils';

describe('normalizeIndonesianPhoneInput', () => {
  it.each([
    ['8216005298', '8216005298'],
    ['08216005298', '8216005298'],
    ['628216005298', '8216005298'],
    ['+628216005298', '8216005298'],
    ['+62 821-6005-298', '8216005298'],
    ['(0821) 6005 298', '8216005298']
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeIndonesianPhoneInput(input)).toBe(expected);
  });

  it('returns an empty string for an empty value', () => {
    expect(normalizeIndonesianPhoneInput('')).toBe('');
    expect(normalizeIndonesianPhoneInput(null)).toBe('');
    expect(normalizeIndonesianPhoneInput(undefined)).toBe('');
  });
});
