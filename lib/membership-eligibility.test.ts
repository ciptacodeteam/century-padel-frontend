import { describe, expect, it } from 'vitest';
import { isMembershipEligibleForStartTime } from './membership-eligibility';

describe('membership eligibility', () => {
  it('allows all-hour and peak-hour packages for every court hour', () => {
    expect(isMembershipEligibleForStartTime('ALL_HOUR', '2026-09-28', '19:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('PEAK_HOUR', '2026-09-28', '08:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('PEAK_HOUR', '2026-09-28', '19:00')).toBe(true);
  });

  it('allows happy-hour packages only before peak hour starts', () => {
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-28', '06:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-28', '14:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-28', '15:59')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-28', '16:00')).toBe(false);
  });

  it('allows happy-hour packages at every hour on Saturday and Sunday', () => {
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-26', '00:00')).toBe(true);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-27', '23:00')).toBe(true);
  });

  it('fails closed for malformed booking dates and times', () => {
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', 'invalid', '15:00')).toBe(false);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-02-30', '15:00')).toBe(false);
    expect(isMembershipEligibleForStartTime('HAPPY_HOUR', '2026-09-26', '24:00')).toBe(false);
  });
});
