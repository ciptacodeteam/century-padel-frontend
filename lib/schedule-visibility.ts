import dayjs, { type ConfigType } from 'dayjs';

export const DEFAULT_SCHEDULE_VISIBILITY_MONTHS = 1;

/**
 * Last bookable calendar day for N months of schedule visibility.
 * Example: today in September, N=1 → end of October; N=4 → end of January.
 */
export function getScheduleVisibilityHorizonDate(
  months: number = DEFAULT_SCHEDULE_VISIBILITY_MONTHS,
  now: ConfigType = new Date()
): dayjs.Dayjs {
  const visibilityMonths = Math.max(DEFAULT_SCHEDULE_VISIBILITY_MONTHS, months);

  return dayjs(now).startOf('month').add(visibilityMonths, 'month').endOf('month');
}
