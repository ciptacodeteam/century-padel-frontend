import type { MembershipType } from '@/types/model';

export const MEMBERSHIP_TYPE_LABEL: Record<MembershipType, string> = {
  ALL_HOUR: 'Semua Jam',
  PEAK_HOUR: 'Peak Hour',
  HAPPY_HOUR: 'Happy Hour'
};

export function isMembershipEligibleForStartTime(
  membershipType: MembershipType,
  startTime: string
): boolean {
  if (membershipType !== 'HAPPY_HOUR') return true;
  const hour = Number(startTime.split(':')[0]);
  return Number.isFinite(hour) && hour >= 6 && hour < 16;
}

export function getMembershipBookingKey(booking: {
  slotId?: string;
  courtId: string;
  date: string;
  timeSlot: string;
}): string {
  return booking.slotId || `${booking.courtId}-${booking.date}-${booking.timeSlot}`;
}
