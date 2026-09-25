import { describe, expect, it } from 'vitest';
import { isMembershipEligibleForStartTime } from './membership-eligibility';

describe('membership eligibility', () => {
  it('allows all-hour and peak-hour packages for every court hour', () => {
    expect(isMembershipEligibleForStartTime('ALL_HOUR', '19:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('PEAK_HOUR', '08:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('PEAK_HOUR', '19:00')).toBe(true);
  });

  it('allows happy-hour packages only before peak hour starts', () => {
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '06:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '14:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '15:59')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '16:00')).toBe(false);
  });
});
