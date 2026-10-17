import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogProvider } from '@/components/ui/dialog';
import type { MembershipTransfer } from '@/types/model';
import { CancelMembershipTransferDialog } from './CancelMembershipTransferDialog';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock('@/mutations/admin/membershipTransaction', () => ({
  useCancelMembershipTransferMutation: () => ({ mutateAsync, isPending: false })
}));
const transfer = {
  id: 'transfer-1',
  fromUserId: 'sender',
  toUserId: 'recipient',
  transferredHours: 4,
  fromUser: { name: 'Budi', phone: '08111' },
  toUser: { name: 'Andi', phone: '08222' },
  cancelledAt: null
} as MembershipTransfer;

function show(isSuperAdmin = true, value = transfer) {
  render(
    <DialogProvider>
      <CancelMembershipTransferDialog
        transfer={value}
        membershipUserId="membership-1"
        isSuperAdmin={isSuperAdmin}
      />
    </DialogProvider>
  );
}

afterEach(cleanup);
beforeEach(() => {
  mutateAsync.mockReset();
});

describe('cancel membership transfer confirmation', () => {
  it('hides cancellation controls from other roles', () => {
    show(false);
    expect(screen.queryByRole('button', { name: 'Batalkan Transfer' })).not.toBeInTheDocument();
  });
  it('shows cancellation audit instead of allowing a repeat', () => {
    show(true, {
      ...transfer,
      cancelledAt: new Date(),
      cancellationReason: 'Salah penerima',
      cancelledByAdmin: { id: 'admin', name: 'Admin' }
    });
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
    expect(screen.getByText('Alasan pembatalan: Salah penerima')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('requires a reason and confirms the parties and exact hours before submitting', async () => {
    mutateAsync.mockResolvedValue({});
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan Transfer' }));
    expect(screen.getByText('Dari: Budi (08111)')).toBeInTheDocument();
    expect(screen.getByText('Kepada: Andi (08222)')).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Konfirmasi Pembatalan' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Alasan pembatalan'), {
      target: { value: '  Salah penerima  ' }
    });
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'membership-1',
        transferId: 'transfer-1',
        reason: 'Salah penerima'
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Konfirmasi Pembatalan' })
      ).not.toBeInTheDocument()
    );
  });
  it('keeps the reason available when the server rejects a used transfer', async () => {
    mutateAsync.mockRejectedValue(new Error('jam sudah digunakan'));
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan Transfer' }));
    fireEvent.change(screen.getByLabelText('Alasan pembatalan'), {
      target: { value: 'Salah penerima' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi Pembatalan' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('Alasan pembatalan')).toHaveValue('Salah penerima');
  });
});
