export const CUSTOMER_RESCHEDULE_MIN_HOURS = 48;

const HOUR_IN_MS = 60 * 60 * 1000;

export const CUSTOMER_RESCHEDULE_POLICY_TEXT =
  'Reschedule hanya dapat diajukan paling lambat H-2 (minimal 48 jam sebelum jadwal bermain).';

export function canCustomerReschedule(slotStart: Date | string, now: Date = new Date()): boolean {
  const slotStartAt = new Date(slotStart);

  if (Number.isNaN(slotStartAt.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  return slotStartAt.getTime() - now.getTime() >= CUSTOMER_RESCHEDULE_MIN_HOURS * HOUR_IN_MS;
}
