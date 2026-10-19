import type { MembershipActivityEvent } from '@/types/membership-activity';

export type MembershipActivityRow = Omit<MembershipActivityEvent, 'status'> & {
  status: MembershipActivityEvent['status'] | 'PARTIAL';
  items: MembershipActivityEvent[];
};

/** Group invoice bookings after package filtering, so each total reflects the selected packages. */
export function groupMembershipBookings(
  events: MembershipActivityEvent[]
): MembershipActivityRow[] {
  const rows: MembershipActivityRow[] = [];
  const bookings = new Map<string, MembershipActivityRow>();
  for (const event of events) {
    const group =
      event.type === 'BOOKING' && event.reference ? bookings.get(event.reference) : undefined;
    if (!group) {
      const row: MembershipActivityRow = { ...event, items: [event] };
      rows.push(row);
      if (event.type === 'BOOKING' && event.reference) bookings.set(event.reference, row);
      continue;
    }
    group.items.push(event);
    group.hours += event.hours;
    group.title = group.items.every((item) => item.court === group.court)
      ? group.items[0].title
      : 'Booking lapangan';
    if (new Date(event.occurredAt).getTime() > new Date(group.occurredAt).getTime())
      group.occurredAt = event.occurredAt;
    const statuses = new Set(group.items.map((item) => item.status));
    group.status =
      statuses.size === 1 ? event.status : statuses.has('CANCELLED') ? 'PARTIAL' : 'HOLD';
  }
  return rows;
}
