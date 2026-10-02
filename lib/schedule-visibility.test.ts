import { describe, expect, it } from 'vitest';
import { getScheduleVisibilityHorizonDate } from './schedule-visibility';

describe('schedule visibility', () => {
  it('uses the venue date when calculating the booking horizon', () => {
    const horizon = getScheduleVisibilityHorizonDate(1, '2026-10-01T17:00:00.000Z');

    expect(horizon.format('YYYY-MM-DD')).toBe('2026-11-02');
  });
});
