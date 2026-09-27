import type { BookingItem } from '@/stores/useBookingStore';
import { describe, expect, it } from 'vitest';
import { calculateMembershipDiscount, type ActiveMembership } from './useMembershipDiscount';

const activeMembership: ActiveMembership = {
  id: 'membership-user-1',
  startDate: '2026-09-27T00:00:00.000Z',
  endDate: '2026-12-26T00:00:00.000Z',
  remainingSessions: 50,
  remainingDuration: 90,
  isExpired: false,
  isSuspended: false,
  membership: {
    id: 'membership-1',
    name: 'All Day',
    price: 10_000_000,
    type: 'ALL_HOUR'
  }
};

const happyHourMembership: ActiveMembership = {
  ...activeMembership,
  id: 'membership-user-happy',
  remainingSessions: 10,
  membership: {
    ...activeMembership.membership,
    id: 'membership-happy',
    name: 'Happy Hour',
    type: 'HAPPY_HOUR'
  }
};

const bookings: BookingItem[] = [
  {
    slotId: 'slot-15',
    courtId: 'court-1',
    courtName: 'Court 1',
    date: '2026-09-28',
    timeSlot: '15:00',
    endTime: '16:00',
    price: 270_000
  },
  {
    slotId: 'slot-16',
    courtId: 'court-1',
    courtName: 'Court 1',
    date: '2026-09-28',
    timeSlot: '16:00',
    endTime: '17:00',
    price: 380_000
  }
];

describe('selected membership slots', () => {
  it('uses membership for the selected later slot and charges the earlier slot', () => {
    const result = calculateMembershipDiscount({ activeMembership }, bookings, true, ['slot-16']);

    expect(result.coveredBookingKeys).toEqual(['slot-16']);
    expect(result.hoursToDeduct).toBe(1);
    expect(result.discountAmount).toBe(380_000);
    expect(result.discountedTotal).toBe(270_000);
  });

  it('prioritizes happy hour before all hour and allocates each slot to the right package', () => {
    const result = calculateMembershipDiscount(
      {
        activeMembership: happyHourMembership,
        activeMemberships: [activeMembership, happyHourMembership]
      },
      bookings,
      true
    );

    expect(result.membershipAllocations).toEqual([
      {
        bookingKey: 'slot-15',
        membershipUserId: 'membership-user-happy',
        hours: 1
      },
      {
        bookingKey: 'slot-16',
        membershipUserId: 'membership-user-1',
        hours: 1
      }
    ]);
    expect(result.discountedTotal).toBe(0);
  });

  it('honors the membership explicitly selected for each slot', () => {
    const result = calculateMembershipDiscount(
      {
        activeMembership: happyHourMembership,
        activeMemberships: [activeMembership, happyHourMembership]
      },
      bookings,
      true,
      ['slot-15', 'slot-16'],
      {
        'slot-15': 'membership-user-1',
        'slot-16': 'membership-user-1'
      }
    );

    expect(result.membershipAllocations.map(({ membershipUserId }) => membershipUserId)).toEqual([
      'membership-user-1',
      'membership-user-1'
    ]);
  });
});
