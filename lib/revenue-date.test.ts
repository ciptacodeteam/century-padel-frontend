import { describe, expect, it } from 'vitest';
import { revenueDateBoundary } from './revenue-date';
describe('revenue dates in Jakarta', () => {
  it('includes all of the selected local day, including its last millisecond', () => {
    const date = new Date(2026, 9, 1);
    expect(revenueDateBoundary(date)).toBe('2026-09-30T17:00:00.000Z');
    expect(revenueDateBoundary(date, true)).toBe('2026-10-01T16:59:59.999Z');
  });
  it('leaves unset dates to the server default', () => {
    expect(revenueDateBoundary(undefined)).toBeUndefined();
  });
});
