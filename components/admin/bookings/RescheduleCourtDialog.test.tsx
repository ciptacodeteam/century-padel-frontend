import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RescheduleCourtDialog, type BookingDetailWithSlot } from './RescheduleCourtDialog';
import { formatSlotTime } from '@/lib/time-utils';

const { queryOptions } = vi.hoisted(() => ({ queryOptions: vi.fn() }));
vi.mock('@/queries/admin/court', () => ({
  adminCourtsWithSlotsQueryOptions: queryOptions
}));
vi.mock('@/api/admin/bookedCourt', () => ({ rescheduleBookedCourtApi: vi.fn() }));
vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ selected, defaultMonth }: { selected: Date; defaultMonth: Date }) => (
    <div>
      <span>Selected: {formatSlotTime(selected, 'YYYY-MM-DD')}</span>
      <span>Month: {formatSlotTime(defaultMonth, 'YYYY-MM')}</span>
    </div>
  )
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('reschedule slot dates', () => {
  it('keeps the booking date, calendar and late evening availability on December 2', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 17, 12));
    const court = { id: 'court-5', name: 'Court 5' };
    const current = {
      id: 'current',
      courtId: court.id,
      court,
      startAt: '2026-12-02T20:00:00.000Z',
      endAt: '2026-12-02T21:00:00.000Z'
    };
    const next = {
      ...current,
      id: 'next',
      isAvailable: true,
      price: 350000,
      startAt: '2026-12-02T21:00:00.000Z',
      endAt: '2026-12-02T22:00:00.000Z'
    };
    const data = { courts: [court], slots: [current, next] };
    queryOptions.mockImplementation((date: string) => ({
      queryKey: ['test-slots', date],
      queryFn: async () => data,
      initialData: data,
      staleTime: Infinity
    }));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RescheduleCourtDialog
          detail={
            {
              id: 'booking',
              price: 350000,
              court,
              courtId: court.id,
              slot: current
            } as unknown as BookingDetailWithSlot
          }
        />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    expect(screen.getByText(/02 Dec 2026.*20:00 - 21:00/)).toBeInTheDocument();
    expect(screen.getByText('Selected: 2026-12-02')).toBeInTheDocument();
    expect(screen.getByText('Month: 2026-12')).toBeInTheDocument();
    expect(screen.getByText('Ketersediaan • 02 Dec 2026')).toBeInTheDocument();
    expect(queryOptions).toHaveBeenLastCalledWith('2026-12-02');
    expect(screen.getByRole('button', { name: /21:00.*Rp/ })).toBeEnabled();
  });
});
