import dayjs, { type ConfigType } from 'dayjs';

export const DEFAULT_SCHEDULE_VISIBILITY_MONTHS = 1;

/**
 * Last bookable day for a rolling N-month schedule visibility window.
 * Example: 24 September with N=1 → 24 October; N=4 → 24 January.
 */
export function getScheduleVisibilityHorizonDate(
  months: number = DEFAULT_SCHEDULE_VISIBILITY_MONTHS,
  now: ConfigType = new Date()
): dayjs.Dayjs {
  const visibilityMonths = Math.max(DEFAULT_SCHEDULE_VISIBILITY_MONTHS, months);

  return dayjs(now).add(visibilityMonths, 'month').endOf('day');
}
