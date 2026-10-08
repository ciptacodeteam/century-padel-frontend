import { format } from 'date-fns';

// Date pickers represent venue calendar dates, not browser/UTC midnight.
export function revenueDateBoundary(date: Date | undefined, end = false) {
  if (!date) return undefined;
  return new Date(
    `${format(date, 'yyyy-MM-dd')}T${end ? '23:59:59.999' : '00:00:00.000'}+07:00`
  ).toISOString();
}
