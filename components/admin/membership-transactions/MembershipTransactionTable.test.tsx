import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DialogProvider } from '@/components/ui/dialog';
import type { MembershipUser } from '@/types/model';
import MembershipTransactionTable from './MembershipTransactionTable';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin/kelola-pemesanan/membership',
  useSearchParams: () => new URLSearchParams()
}));
const { reschedule, grant, approve, reject, unsuspend, transfer, suspend, terminate, exportExcel } =
  vi.hoisted(() => ({
    reschedule: vi.fn(),
    grant: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    unsuspend: vi.fn(),
    transfer: vi.fn(),
    suspend: vi.fn(),
    terminate: vi.fn(),
    exportExcel: vi.fn()
  }));
vi.mock('@/mutations/admin/membershipTransaction', () => ({
  useRescheduleMembershipStartMutation: () => ({ mutateAsync: reschedule }),
  useApproveMembershipTransactionMutation: () => ({ confirmAndMutate: approve }),
  useRejectMembershipTransactionMutation: () => ({ confirmAndMutate: reject }),
  useUnsuspendMembershipTransactionMutation: () => ({ confirmAndMutate: unsuspend }),
  useSuspendMembershipTransactionMutation: () => ({ mutate: suspend }),
  useTerminateAndRefundMembershipMutation: () => ({ mutate: terminate }),
  useTransferMembershipBalanceMutation: () => ({ mutateAsync: transfer }),
  useGrantMembershipComplimentaryMutation: () => ({ mutateAsync: grant }),
  useExportMembershipTransactionsExcel: () => ({ mutate: exportExcel, isPending: false }),
  useCancelMembershipTransferMutation: () => ({ mutateAsync: vi.fn() })
}));
const membership = (index: number): MembershipUser =>
  ({
    id: `membership-${index}`,
    userId: `user-${index}`,
    acquisitionType: 'PURCHASE',
    user: { name: index === 0 ? 'Kevin Keegan' : `Member ${index}`, phone: '+62812345678' },
    membership: { name: '100-HOUR HAPPY PACKAGE', sessions: 100, duration: 180 },
    invoice: { number: `INV-${index}`, status: 'PAID', total: 17000000 },
    remainingSessions: 95,
    remainingComplimentarySessions: 3,
    totalComplimentarySessions: 3,
    isExpired: false,
    isSuspended: false,
    startDate: new Date('2020-01-01'),
    endDate: new Date('2099-01-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  }) as MembershipUser;
function show(role = 'ADMIN', rows = [membership(0)]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['admin', 'auth', 'profile'], { data: { role } });
  client.setQueryData(['admin', 'membership-transactions', {}], { data: rows });
  render(
    <QueryClientProvider client={client}>
      <DialogProvider>
        <MembershipTransactionTable />
      </DialogProvider>
    </QueryClientProvider>
  );
  return client;
}
function card(name = 'Kevin Keegan') {
  return within(screen.getByRole('article', { name: `Membership ${name}` }));
}
async function menu() {
  const button = card().getByRole('button', { name: 'Tindakan membership Kevin Keegan' });
  fireEvent.keyDown(button, { key: 'ArrowDown', code: 'ArrowDown' });
  return screen.findByRole('menu');
}
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
describe('membership responsive actions and cards', () => {
  it('shows compact Detail and menu controls, with the same status and balance on mobile cards', () => {
    show();
    expect(card().getAllByRole('button')).toHaveLength(2);
    expect(card().getByRole('button', { name: 'Detail' })).toBeInTheDocument();
    expect(card().getByText('Aktif')).toBeInTheDocument();
    expect(card().getByText(/Complimentary: 3 jam/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hentikan & Refund' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select row' })).not.toBeInTheDocument();
  });
  it('opens the complimentary form from the menu and keeps it open after the menu closes', async () => {
    show();
    const items = within(await menu());
    fireEvent.click(items.getByRole('menuitem', { name: 'Tambah Kuota Complimentary' }));
    const dialog = await screen.findByRole('dialog');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Jumlah kuota (jam)'), {
      target: { value: '2' }
    });
    fireEvent.change(within(dialog).getByLabelText('Alasan pemberian'), {
      target: { value: 'Kompensasi lapangan' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tambah Kuota' }));
    await waitFor(() =>
      expect(grant).toHaveBeenCalledWith({
        id: 'membership-0',
        hours: 2,
        reason: 'Kompensasi lapangan',
        requestId: expect.any(String)
      })
    );
  });
  it('keeps owner-only actions hidden from Manager and preserves refund confirmation', async () => {
    show('ADMIN_VIEWER');
    const items = within(await menu());
    expect(
      items.queryByRole('menuitem', { name: 'Tambah Kuota Complimentary' })
    ).not.toBeInTheDocument();
    expect(items.queryByRole('menuitem', { name: 'Transfer Saldo' })).not.toBeInTheDocument();
    fireEvent.click(items.getByRole('menuitem', { name: 'Hentikan & Refund' }));
    expect(await screen.findByText('Tindakan ini bersifat permanen.')).toBeInTheDocument();
    expect(terminate).not.toHaveBeenCalled();
  });
  it('does not offer quota or balance actions for a revoked transfer', () => {
    show('ADMIN', [
      {
        ...membership(0),
        acquisitionType: 'TRANSFER',
        invoice: undefined,
        remainingSessions: 0,
        isExpired: true,
        incomingTransfer: { cancelledAt: new Date() }
      } as MembershipUser
    ]);
    expect(card().getAllByRole('button')).toHaveLength(1);
    expect(card().getByRole('button', { name: 'Detail' })).toBeInTheDocument();
  });
  it('uses the same filtered and paginated records for cards and table', async () => {
    show(
      'ADMIN',
      Array.from({ length: 12 }, (_, index) => membership(index))
    );
    expect(screen.getAllByRole('article')).toHaveLength(10);
    fireEvent.click(screen.getByLabelText('Go to next page'));
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cari transaksi' }), {
      target: { value: 'Kevin Keegan' }
    });
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(card().getByText('Kevin Keegan')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Cari transaksi' }), {
      target: { value: 'not-a-member' }
    });
    await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument());
    expect(screen.getByText('Tidak ada membership ditemukan.')).toBeInTheDocument();
  });
});

it('opens activation scheduling for an unused purchase and submits the date and reason', async () => {
  const unused = {
    ...membership(0),
    remainingSessions: 100,
    remainingComplimentarySessions: 0,
    totalComplimentarySessions: 0,
    _count: { bookingDetails: 0, outgoingTransfers: 0 }
  };
  show('ADMIN', [unused]);
  fireEvent.click(within(await menu()).getByRole('menuitem', { name: 'Atur Tanggal Mulai' }));
  const dialog = within(await screen.findByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('Tanggal mulai aktif (WIB)'), {
    target: { value: '2099-11-02' }
  });
  fireEvent.change(dialog.getByLabelText('Alasan perubahan'), {
    target: { value: 'Permintaan pelanggan' }
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Simpan Tanggal Mulai' }));
  await waitFor(() =>
    expect(reschedule).toHaveBeenCalledWith({
      id: 'membership-0',
      startDate: '2099-11-02',
      reason: 'Permintaan pelanggan'
    })
  );
});

it('hides date scheduling when a restored balance still has booking history', async () => {
  show('ADMIN', [
    {
      ...membership(0),
      remainingSessions: 100,
      totalComplimentarySessions: 0,
      remainingComplimentarySessions: 0,
      _count: { bookingDetails: 1, outgoingTransfers: 0 }
    }
  ]);
  expect(
    within(await menu()).queryByRole('menuitem', { name: 'Atur Tanggal Mulai' })
  ).not.toBeInTheDocument();
});
