import type { MembershipType } from '@/types/model';

export const MEMBERSHIP_TYPE_LABEL: Record<MembershipType, string> = {
  ALL_HOUR: 'Semua Jam',
  PEAK_HOUR: 'Peak Hour',
  HAPPY_HOUR: 'Happy Hour'
};

export function isMembershipEligibleForStartTime(
  membershipType: MembershipType,
  date: string,
  startTime: string
): boolean {
  if (membershipType !== 'HAPPY_HOUR') return true;
  const hour = Number(startTime.split(':')[0]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;

  const dateParts = date.split('-').map(Number);
  if (
    dateParts.length !== 3 ||
    dateParts.some((part) => !Number.isInteger(part)) ||
    dateParts[1] < 1 ||
    dateParts[1] > 12 ||
    dateParts[2] < 1 ||
    dateParts[2] > 31
  ) {
    return false;
  }

  // Use UTC to derive the weekday from a date-only value consistently in every
  // browser timezone. Booking dates are always represented as YYYY-MM-DD.
  const [year, month, day] = dateParts;
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return false;
  }
  const weekday = parsedDate.getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;

  return isWeekend || (hour >= 6 && hour < 16);
}

export function getMembershipBookingKey(booking: {
  slotId?: string;
  courtId: string;
  date: string;
  timeSlot: string;
}): string {
  return booking.slotId || `${booking.courtId}-${booking.date}-${booking.timeSlot}`;
}
