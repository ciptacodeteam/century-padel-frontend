import { describe, expect, it } from 'vitest';
import {
  getMembershipBookingBenefits,
  type MembershipBenefitDetail
} from './membership-booking-benefit';

const detail = (overrides: Partial<MembershipBenefitDetail> = {}): MembershipBenefitDetail => ({
  price: 300_000,
  membershipUserId: 'happy',
  membershipUser: {
    membership: { name: 'Happy Hour', type: 'HAPPY_HOUR', price: 2_500_000, sessions: 10 },
    invoice: { subtotal: 2_200_000, promoDiscountAmount: 200_000, status: 'PAID' }
  },
  slot: { startAt: '2026-10-16 10:00:00', endAt: '2026-10-16 11:00:00' },
  ...overrides
});

describe('user invoice membership benefits', () => {
  it('uses purchase price after discount and excludes the payment processing fee', () => {
    const [benefit] = getMembershipBookingBenefits([detail(), detail()]);
    expect(benefit).toMatchObject({
      hours: 2,
      hourlyRate: 200_000,
      regularPrice: 600_000,
      usageValue: 400_000,
      savings: 200_000
    });
  });

  it('separates packages and excludes regular and cancelled court slots', () => {
    const result = getMembershipBookingBenefits([
      detail(),
      detail({
        membershipUserId: 'peak',
        membershipUser: { membership: { name: 'Peak', price: 3_000_000, sessions: 10 } }
      }),
      detail({ membershipUserId: null }),
      detail({ cancelledAt: '2026-10-16' })
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.hours)).toEqual([1, 1]);
    expect(result[1].hourlyRate).toBe(300_000);
  });

  it('matches hour deductions for partial slots and avoids invalid time ranges', () => {
    const [benefit] = getMembershipBookingBenefits([
      detail({ slot: { startAt: '2026-10-16 10:00:00', endAt: '2026-10-16 10:30:00' } }),
      detail({ slot: { startAt: 'bad', endAt: 'bad' } }),
      detail({ slot: { startAt: '2026-10-16 11:00:00', endAt: '2026-10-16 10:00:00' } })
    ]);
    expect(benefit.hours).toBe(1);
  });

  it('does not invent rates for missing or zero package hours or show negative savings', () => {
    expect(
      getMembershipBookingBenefits([detail({ membershipUser: null })])[0].hourlyRate
    ).toBeNull();
    expect(
      getMembershipBookingBenefits([
        detail({ membershipUser: { membership: { name: 'Zero', price: 200_000, sessions: 0 } } })
      ])[0].usageValue
    ).toBeNull();
    expect(getMembershipBookingBenefits([detail({ price: 100_000 })])[0].savings).toBe(0);
  });
});
