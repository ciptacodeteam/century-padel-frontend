import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogProvider } from '@/components/ui/dialog';
import type { MembershipUser } from '@/types/model';
import { GrantMembershipComplimentaryDialog } from './GrantMembershipComplimentaryDialog';

afterEach(cleanup);
function show(onGrant: (payload: any) => Promise<unknown>) {
  render(
    <DialogProvider>
      <GrantMembershipComplimentaryDialog
        membership={
          {
            id: 'membership',
            endDate: new Date('2099-12-01'),
            user: { name: 'Budi' },
            membership: { name: 'Happy Hour' }
          } as MembershipUser
        }
        onGrant={onGrant}
      />
    </DialogProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Kuota Complimentary' }));
}
function fill() {
  fireEvent.change(screen.getByLabelText('Jumlah kuota (jam)'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Alasan pemberian'), {
    target: { value: '  Kompensasi lapangan  ' }
  });
}
describe('complimentary quota form', () => {
  it('requires valid whole hours and a reason, and sends no expiry or financial values', async () => {
    const onGrant = vi.fn().mockResolvedValue({});
    show(onGrant);
    expect(screen.getByRole('button', { name: 'Tambah Kuota' })).toBeDisabled();
    fill();
    fireEvent.change(screen.getByLabelText('Jumlah kuota (jam)'), { target: { value: '0.5' } });
    expect(screen.getByRole('button', { name: 'Tambah Kuota' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Jumlah kuota (jam)'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Kuota' }));
    await waitFor(() => expect(onGrant).toHaveBeenCalledOnce());
    expect(onGrant.mock.calls[0][0]).toEqual({
      hours: 2,
      reason: 'Kompensasi lapangan',
      requestId: expect.any(String)
    });
  });
  it('retries an ambiguous network failure using the identical request key', async () => {
    const onGrant = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({});
    show(onGrant);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Kuota' }));
    const retry = await screen.findByRole('button', { name: 'Coba Kembali' });
    expect(screen.getByLabelText('Jumlah kuota (jam)')).toBeDisabled();
    fireEvent.click(retry);
    await waitFor(() => expect(onGrant).toHaveBeenCalledTimes(2));
    expect(onGrant.mock.calls[0][0]).toEqual(onGrant.mock.calls[1][0]);
  });
  it('allows correction after a definitive validation rejection', async () => {
    const onGrant = vi.fn().mockRejectedValue({ code: 400, msg: 'Invalid input' });
    show(onGrant);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Kuota' }));
    await waitFor(() => expect(onGrant).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByLabelText('Jumlah kuota (jam)')).toBeEnabled());
  });
});
