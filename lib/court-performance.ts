import type { CourtPerformanceDetail } from '@/types/court-performance';

export type CourtPerformanceDisplayDetail = CourtPerformanceDetail & {
  sessions: CourtPerformanceDetail[];
};

// Filter source details before grouping so searches and peak filters keep exact totals.
export function groupComplimentaryInvoices(details: CourtPerformanceDetail[]) {
  const rows: CourtPerformanceDisplayDetail[] = [];
  const invoices = new Map<string, CourtPerformanceDisplayDetail>();
  for (const detail of details) {
    const key =
      detail.groupId === 'complimentary'
        ? detail.invoiceId
          ? `invoice:${detail.invoiceId}`
          : `booking:${detail.bookingId}`
        : null;
    const existing = key ? invoices.get(key) : undefined;
    if (existing) {
      existing.sessions.push(detail);
      existing.hours += detail.hours;
      existing.elapsedHours += detail.elapsedHours;
      existing.upcomingHours += detail.upcomingHours;
      existing.normalValue += detail.normalValue;
      existing.court = [...new Set(existing.sessions.map((s) => s.court))].join(', ');
      existing.customer = [...new Set(existing.sessions.map((s) => s.customer))].join(', ');
    } else {
      const row = { ...detail, sessions: [detail] };
      rows.push(row);
      if (key) invoices.set(key, row);
    }
  }
  return rows;
}
