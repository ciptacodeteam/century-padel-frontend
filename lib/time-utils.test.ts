import { describe, expect, it } from 'vitest';
import { formatSlotTime, toLocalSlotDate } from './time-utils';

describe('slot time utilities', () => {
  it('parses the API space-separated datetime consistently', () => {
    expect(formatSlotTime('2026-10-25 17:00:00')).toBe('17:00');
    expect(formatSlotTime('2026-10-25 17:00:00', 'YYYY-MM-DD')).toBe('2026-10-25');
  });

  it('keeps ISO clock components without timezone conversion', () => {
    expect(formatSlotTime('2026-10-25T17:00:00Z')).toBe('17:00');
    expect(formatSlotTime('2026-10-25T17:00:00+07:00')).toBe('17:00');
  });

  it('returns null for an invalid datetime', () => {
    expect(toLocalSlotDate('not-a-date')).toBeNull();
  });
});
