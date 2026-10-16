import { describe, expect, it } from 'vitest';
import { summarizeBookingSlots } from './booking-summary';
import { formatSlotTime } from './time-utils';

const slot = (courtId: string, day: string, start: string, end: string) => ({
  courtId,
  court: { name: courtId },
  slot: { startAt: `2026-10-${day} ${start}:00`, endAt: `2026-10-${day} ${end}:00` }
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
