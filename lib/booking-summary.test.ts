import { describe, expect, it } from 'vitest';
import { getBookingSummaryDetails, summarizeBookingSlots } from './booking-summary';
import { formatSlotTime } from './time-utils';

const slot = (courtId: string, day: string, start: string, end: string) => ({
  courtId,
  court: { name: courtId },
  slot: { startAt: `2026-10-${day} ${start}:00`, endAt: `2026-10-${day} ${end}:00` }
});

describe('admin booking list summary', () => {
  it('shows active November 18 slots instead of cancelled November 25 slots', () => {
    const cancelled = {
      court: { name: 'Court 5' },
      slot: { startAt: '2026-11-25T20:00:00', endAt: '2026-11-25T21:00:00' },
      cancelledAt: '2026-11-13T10:00:00Z'
    };
    const active = ['20:00', '21:00'].map((start, index) => ({
      court: { name: 'Court 2' },
      slot: {
        startAt: `2026-11-18T${start}:00`,
        endAt: `2026-11-18T${index + 21}:00:00`
      },
      cancelledAt: null
    }));
    const details = [cancelled, ...active, cancelled];
    const summary = getBookingSummaryDetails(details);
    expect(summary).toEqual(active);
    expect(summary[0].slot.startAt).toBe('2026-11-18T20:00:00');
    expect(summary.length - 1).toBe(1);
    expect(details).toHaveLength(4);
  });

  it('shows the new date for an active rescheduled slot', () => {
    const details = [{ cancelledAt: null, slot: { startAt: '2026-11-25T20:00:00' } }];
    expect(getBookingSummaryDetails(details)).toEqual(details);
  });

  it('keeps history visible when every slot is cancelled', () => {
    const details = [{ cancelledAt: '2026-11-13T10:00:00Z' }];
    expect(getBookingSummaryDetails(details)).toEqual(details);
  });

  it('supports empty bookings and older details without cancellation metadata', () => {
    expect(getBookingSummaryDetails([])).toEqual([]);
    expect(getBookingSummaryDetails([{}, { cancelledAt: null }])).toHaveLength(2);
  });
});

describe('invoice booking summary', () => {
  it('merges unsorted consecutive slots on the same court using the actual end time', () => {
    const result = summarizeBookingSlots([
      slot('Court 4', '15', '20:00', '21:00'),
      slot('Court 4', '15', '19:00', '20:00'),
      slot('Court 4', '15', '21:00', '21:30')
    ]);
    expect(result).toHaveLength(1);
    expect(formatSlotTime(result[0].startAt)).toBe('19:00');
    expect(formatSlotTime(result[0].endAt)).toBe('21:30');
  });

  it('keeps gaps, different courts, and different dates separate', () => {
    expect(
      summarizeBookingSlots([
        slot('Court 4', '15', '19:00', '20:00'),
        slot('Court 4', '15', '21:00', '22:00'),
        slot('Court 3', '15', '20:00', '21:00'),
        slot('Court 4', '16', '19:00', '20:00')
      ])
    ).toHaveLength(4);
  });
});
