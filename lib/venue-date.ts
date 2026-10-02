import dayjs, { type ConfigType } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const VENUE_TIME_ZONE = 'Asia/Jakarta';

/** Returns the venue's calendar date, independent of the browser timezone. */
export function getVenueDateKey(now: ConfigType = new Date()): string {
  return dayjs(now).tz(VENUE_TIME_ZONE).format('YYYY-MM-DD');
}

/**
 * Converts a YYYY-MM-DD key into a local Date with the same calendar fields.
 * Calendar components need a Date, but must not parse the key as UTC.
 */
export function dateKeyToLocalDate(dateKey: string): Date {
  const [year, month, date] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, date);
}

export function getVenueTodayLocalDate(now: ConfigType = new Date()): Date {
  return dateKeyToLocalDate(getVenueDateKey(now));
}
