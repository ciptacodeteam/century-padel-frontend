import dayjs, { type ConfigType } from 'dayjs';
import { toLocalSlotDate } from './time-utils';

export const BOOKING_SLOT_CUTOFF_MINUTES_BEFORE_END = 5;

export function isSlotBeforeBookingCutoff(
  endAt: ConfigType,
  now: ConfigType = new Date()
): boolean {
  const normalizedEndAt = typeof endAt === 'string' ? toLocalSlotDate(endAt) : endAt;
  if (!normalizedEndAt) return false;

  return dayjs(now).isBefore(
    dayjs(normalizedEndAt).subtract(BOOKING_SLOT_CUTOFF_MINUTES_BEFORE_END, 'minute')
  );
}

export function isHourlyBookingTimeVisible(
  date: string,
  startTime: string,
  now: ConfigType = new Date()
): boolean {
  const slotEnd = dayjs(`${date} ${startTime}`).add(1, 'hour');
  return isSlotBeforeBookingCutoff(slotEnd, now);
}
