import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Booking } from '@/types/model';
import { CorrectComplimentaryMembershipDialog } from './CorrectComplimentaryMembershipDialog';

const { getOptions, correct } = vi.hoisted(() => ({ getOptions: vi.fn(), correct: vi.fn() }));
vi.mock('@/api/admin/booking', () => ({
  getMembershipCorrectionOptionsApi: getOptions,
  correctComplimentaryMembershipApi: correct
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      aria-label="Paket pengganti"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Pilih paket</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>
}));
const booking = {
  id: 'booking-1',
  details: [
    { id: 'd1', complimentaryMembershipHours: 10, complimentaryCreditMinutes: 0, cancelledAt: null }
  ]
} as Booking;
function mount(value = booking) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CorrectComplimentaryMembershipDialog booking={value} />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  getOptions.mockResolvedValue({
    hours: 10,
    memberships: [
      {
        id: 'target',
        name: '100 Jam',
        invoiceNumber: 'INV-100',
        paidHours: 100,
        remainingHours: 100
      }
    ]
  });
  correct.mockResolvedValue({});
});
describe('complimentary correction dialog', () => {
  it('requires an explicit package and reason, previews balance and submits no client-controlled hours', async () => {
    mount();
    fireEvent.click(screen.getByText('Alihkan ke paket berbayar'));
    await screen.findByText(/100 Jam/);
    const submit = screen.getByRole('button', { name: 'Konfirmasi potong 10 jam' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Paket pengganti'), { target: { value: 'target' } });
    expect(screen.getByText('90 jam')).toBeInTheDocument();
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Alasan koreksi'), {
      target: { value: 'Salah input gratis' }
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(correct).toHaveBeenCalledWith('booking-1', {
        membershipUserId: 'target',
        reason: 'Salah input gratis'
      })
    );
  });
  it('blocks confirmation when no valid paid package exists', async () => {
    getOptions.mockResolvedValue({ hours: 10, memberships: [] });
    mount();
    fireEvent.click(screen.getByText('Alihkan ke paket berbayar'));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Konfirmasi potong 10 jam' })).toBeDisabled();
    expect(correct).not.toHaveBeenCalled();
  });
  it('does not offer a second correction after success or for regular bookings', () => {
    const { unmount } = mount({
      ...booking,
      membershipCorrection: {
        hours: 10,
        reason: 'corrected',
        createdAt: '',
        targetMembershipUserId: 'target'
      }
    });
    expect(screen.queryByText('Alihkan ke paket berbayar')).not.toBeInTheDocument();
    unmount();
    mount({ ...booking, details: [] });
    expect(screen.queryByText('Alihkan ke paket berbayar')).not.toBeInTheDocument();
  });
});
