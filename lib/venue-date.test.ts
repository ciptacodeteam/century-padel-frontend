import { describe, expect, it } from 'vitest';
import { dateKeyToLocalDate, getVenueDateKey, getVenueTodayLocalDate } from './venue-date';

describe('venue date', () => {
  it('changes day at midnight in Asia/Jakarta', () => {
    expect(getVenueDateKey('2026-10-01T16:59:59.999Z')).toBe('2026-10-01');
    expect(getVenueDateKey('2026-10-01T17:00:00.000Z')).toBe('2026-10-02');
  });

  it('creates calendar Dates without UTC date shifting', () => {
    const date = dateKeyToLocalDate('2026-10-02');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(2);
  });

  it('returns a calendar Date for today at the venue', () => {
    const date = getVenueTodayLocalDate('2026-10-01T17:00:00.000Z');

    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([2026, 10, 2]);
  });
});
