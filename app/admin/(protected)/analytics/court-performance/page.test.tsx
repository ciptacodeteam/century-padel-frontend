import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourtPerformance } from '@/types/court-performance';
import CourtPerformancePage from './page';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/adminApi', () => ({ adminApi: { get } }));
vi.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({ hasAccess: true, isLoading: false })
}));

const fixture: CourtPerformance = {
  summary: {
    hours: 3,
    elapsedHours: 2,
    upcomingHours: 1,
    availableHours: 10,
    occupancy: 30,
    elapsedOccupancy: 20,
    membershipHours: 1,
    regularHours: 2
  },
  rows: [
    {
      id: 'regular:peak',
      name: 'Non-membership · Peak',
      kind: 'regular',
      packageHours: null,
      hours: 2,
      elapsedHours: 2,
      upcomingHours: 0,
      normalValue: 600000,
      bookings: 1,
      customers: 1
    },
    {
      id: 'membership:200',
      name: 'All Day 200 Hours',
      kind: 'membership',
      packageHours: 200,
      hours: 1,
      elapsedHours: 0,
      upcomingHours: 1,
      normalValue: 300000,
      bookings: 1,
      customers: 1
    },
    {
      id: 'membership:50',
      name: 'All Day 50 Hours',
      kind: 'membership',
      packageHours: 50,
      hours: 0,
      elapsedHours: 0,
      upcomingHours: 0,
      normalValue: 0,
      bookings: 0,
      customers: 0
    }
  ],
  details: [
    {
      id: 'd1',
      groupId: 'regular:peak',
      category: 'Non-membership · Peak',
      bookingId: 'b1',
      customer: 'Andi',
      court: 'Court 1',
      startAt: '2026-10-08T16:00:00Z',
      endAt: '2026-10-08T18:00:00Z',
      bookedAt: '2026-09-20T08:00:00Z',
      band: 'Peak',
      hours: 2,
      elapsedHours: 2,
      upcomingHours: 0,
      normalValue: 600000,
      invoiceId: 'i1',
      invoiceNumber: 'INV-001'
    },
    {
      id: 'd2',
      groupId: 'membership:200',
      category: 'All Day 200 Hours',
      bookingId: 'b2',
      customer: 'Budi',
      court: 'Court 2',
      startAt: '2026-10-09T10:00:00Z',
      endAt: '2026-10-09T11:00:00Z',
      bookedAt: '2026-10-01T08:00:00Z',
      band: 'Non-Peak',
      hours: 1,
      elapsedHours: 0,
      upcomingHours: 1,
      normalValue: 300000,
      invoiceId: 'i2',
      invoiceNumber: 'INV-002'
    }
  ],
  courts: [{ id: 'c1', name: 'Court 1' }],
  period: { startDate: '2026-10-01', endDate: '2026-10-31' },
  generatedAt: '2026-10-08T12:00:00Z'
};
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CourtPerformancePage />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { data: fixture } });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('Court Performance UI', () => {
  it('opens package details including zero-use packages, and resets to all bookings', async () => {
    mount();
    await screen.findByText('Andi');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat detail All Day 200 Hours' }));
    const details = screen.getByRole('region', { name: 'All Day 200 Hours' });
    expect(within(details).getByText('Budi')).toBeInTheDocument();
    expect(within(details).queryByText('Andi')).not.toBeInTheDocument();
    expect(within(details).getByRole('link', { name: 'INV-002' })).toHaveAttribute(
      'href',
      '/admin/kelola-transaksi/i2'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lihat detail All Day 50 Hours' }));
    expect(screen.getByText('Belum ada booking yang sesuai')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset kategori' }));
    expect(screen.getByText('Andi')).toBeInTheDocument();
  });
  it('searches customer and filters band without changing summary totals', async () => {
    mount();
    await screen.findByText('Andi');
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Cari customer, invoice, atau lapangan' }),
      { target: { value: 'Budi' } }
    );
    expect(screen.queryByText('Andi')).not.toBeInTheDocument();
    expect(screen.getByText('Budi')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter peak dan non-peak' }), {
      target: { value: 'Peak' }
    });
    expect(screen.getByText('Belum ada booking yang sesuai')).toBeInTheDocument();
    expect(screen.getByText('Total seluruh kategori')).toBeInTheDocument();
  });
  it('applies custom dates and court only on submit, and rejects reversed dates', async () => {
    mount();
    await screen.findByText('Andi');
    fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: '2026-10-10' } });
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-10-09' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(screen.getByRole('alert')).toHaveTextContent('maksimal 366 hari');
    expect(get).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-10-12' } });
    fireEvent.change(screen.getByLabelText('Lapangan'), { target: { value: 'c1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith('/analytics/court-performance', {
        params: { startDate: '2026-10-10', endDate: '2026-10-12', courtId: 'c1' }
      })
    );
  });
  it('shows retry rather than a zero-usage report on API failure', async () => {
    get.mockRejectedValue(new Error('offline'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('belum berhasil');
    expect(screen.queryByText('Total seluruh kategori')).not.toBeInTheDocument();
    get.mockResolvedValue({ data: { data: fixture } });
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText('Andi')).toBeInTheDocument();
  });
});
