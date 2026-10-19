import { describe, expect, it } from 'vitest';
import { groupMembershipBookings } from './membership-activity';
import type { MembershipActivityEvent } from '@/types/membership-activity';

const booking = (overrides: Partial<MembershipActivityEvent> = {}): MembershipActivityEvent => ({
  id: 'slot-1',
  membershipUserId: 'package-1',
  type: 'BOOKING',
  title: 'Booking Court 1',
  court: 'Court 1',
  hours: -1,
  occurredAt: '2026-10-20T08:00:00Z',
  reference: 'INV-1',
  status: 'COMPLETED',
  ...overrides
});

describe('booking history grouped by invoice reference', () => {
  it('totals all slots on the same reference across dates, courts and packages without mutating source data', () => {
    const input = [
      booking(),
      booking({
        id: 'slot-2',
        hours: -4,
        court: 'Court 2',
        membershipUserId: 'package-2',
        startAt: '2026-10-22T18:00:00Z'
      })
    ];
    const rows = groupMembershipBookings(input);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ hours: -5, reference: 'INV-1', title: 'Booking lapangan' });
    expect(rows[0].items).toHaveLength(2);
    expect(input.map((event) => event.hours)).toEqual([-1, -4]);
  });

  it('keeps different invoice references separate even when the booking dates match', () => {
    expect(
      groupMembershipBookings([booking(), booking({ id: 'slot-2', reference: 'INV-2' })])
    ).toHaveLength(2);
  });

  it('preserves cancellation status and keeps refunds and transfers separate from the original debit', () => {
    const rows = groupMembershipBookings([
      booking(),
      booking({ id: 'cancelled', hours: -2, status: 'CANCELLED' }),
      booking({ id: 'return', type: 'RETURN', hours: 2 }),
      booking({ id: 'transfer', type: 'TRANSFER_OUT', hours: -3 })
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ hours: -3, status: 'PARTIAL' });
    expect(rows[1]).toMatchObject({ type: 'RETURN', hours: 2 });
    expect(rows[2]).toMatchObject({ type: 'TRANSFER_OUT', hours: -3 });
    expect(rows.reduce((sum, row) => sum + row.hours, 0)).toBe(-4);
  });
});
