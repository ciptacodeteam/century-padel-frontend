import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogProvider } from '@/components/ui/dialog';
import type { MembershipUser } from '@/types/model';
import { jakartaDate, RescheduleMembershipStartDialog } from './RescheduleMembershipStartDialog';

const membership = {
  id: 'membership',
  membership: { name: 'Paket 10 jam' },
  user: { name: 'Budi' },
  startDate: new Date('2026-10-25T04:30:00Z'),
  endDate: new Date('2026-11-24T04:30:00Z')
} as MembershipUser;
function show(onSubmit = vi.fn().mockResolvedValue({})) {
  const onOpenChange = vi.fn();
  render(
    <DialogProvider>
      <RescheduleMembershipStartDialog
        membership={membership}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </DialogProvider>
  );
  return { onSubmit, onOpenChange };
}
afterEach(cleanup);
describe('schedule activation dialog', () => {
  it('requires a date and reason, previews the unchanged duration and sends a date-only value', async () => {
    const { onSubmit, onOpenChange } = show();
    const save = screen.getByRole('button', { name: 'Simpan Tanggal Mulai' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Tanggal mulai aktif (WIB)'), {
      target: { value: '2099-11-02' }
    });
    fireEvent.change(screen.getByLabelText('Alasan perubahan'), {
      target: { value: 'Permintaan pelanggan' }
    });
    expect(screen.getByText(/Durasi tetap 30 hari/)).toHaveTextContent('2 November 2099');
    fireEvent.click(save);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        startDate: '2099-11-02',
        reason: 'Permintaan pelanggan'
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  it('keeps input values and the dialog open on a server rejection', async () => {
    const { onOpenChange } = show(vi.fn().mockRejectedValue(new Error('Sudah digunakan')));
    fireEvent.change(screen.getByLabelText('Tanggal mulai aktif (WIB)'), {
      target: { value: '2099-11-02' }
    });
    fireEvent.change(screen.getByLabelText('Alasan perubahan'), {
      target: { value: 'Permintaan pelanggan' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Tanggal Mulai' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan Tanggal Mulai' })).toBeEnabled()
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Alasan perubahan')).toHaveValue('Permintaan pelanggan');
  });
  it('uses Jakarta rather than the browser timezone for calendar boundaries', () => {
    expect(jakartaDate(new Date('2026-11-01T18:00:00Z'))).toBe('2026-11-02');
  });
});
