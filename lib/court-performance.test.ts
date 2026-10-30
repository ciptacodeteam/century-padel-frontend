import { describe, expect, it } from 'vitest';
import type { CourtPerformanceDetail } from '@/types/court-performance';
import { groupComplimentaryInvoices } from './court-performance';

const detail: CourtPerformanceDetail = {
  id: 'd1',
  groupId: 'complimentary',
  category: 'Complimentary',
  bookingId: 'b1',
  customer: 'Andi',
  court: 'Court 1',
  startAt: '2026-10-08T10:00:00Z',
  endAt: '2026-10-08T11:00:00Z',
  bookedAt: '2026-10-01T00:00:00Z',
  band: 'Non-Peak',
  hours: 1,
  elapsedHours: 1,
  upcomingHours: 0,
  normalValue: 300000,
  invoiceId: 'i1',
  invoiceNumber: 'INV-001'
};

describe('complimentary invoice rows', () => {
  it('groups the same invoice across bookings, dates and courts and preserves exact schedules', () => {
    const second = {
      ...detail,
      id: 'd2',
      bookingId: 'b2',
      court: 'Court 2',
      startAt: '2026-10-10T15:00:00Z',
      endAt: '2026-10-10T16:00:00Z',
      elapsedHours: 0,
      upcomingHours: 1
    };
    const rows = groupComplimentaryInvoices([detail, second]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      hours: 2,
      elapsedHours: 1,
      upcomingHours: 1,
      normalValue: 600000,
      court: 'Court 1, Court 2',
      sessions: [detail, second]
    });
    expect(detail.hours).toBe(1);
  });
  it('keeps other invoices, bookings without invoices, and paid categories separate', () => {
    const rows = groupComplimentaryInvoices([
      detail,
      { ...detail, id: 'd2', invoiceId: 'i2' },
      { ...detail, id: 'd3', invoiceId: null },
      { ...detail, id: 'd4', invoiceId: null, bookingId: 'b2' },
      { ...detail, id: 'd5', groupId: 'membership:1' },
      { ...detail, id: 'd6', groupId: 'membership:1' }
    ]);
    expect(rows).toHaveLength(6);
  });
});
