import {
  approveAdminMembershipTransactionApi,
  rejectAdminMembershipTransactionApi,
  suspendAdminMembershipTransactionApi,
  terminateAndRefundAdminMembershipTransactionApi,
  transferAdminMembershipBalanceApi,
  unsuspendAdminMembershipTransactionApi,
  exportAdminMembershipTransactionsExcelApi
} from '@/api/admin/membershipTransaction';
import type { SearchParamsData } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';

export const useApproveMembershipTransactionMutation = () => {
  return useConfirmMutation<string, any>(
    {
      mutationFn: (id: string) => approveAdminMembershipTransactionApi(id)
    },
    {
      title: 'Setujui transaksi?',
      description: 'Transaksi membership akan disetujui.',
      confirmText: 'Setujui',
      destructive: false,
      toastMessages: {
        loading: 'Menyetujui…',
        success: 'Transaksi berhasil disetujui',
        error: 'Gagal menyetujui transaksi'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useRejectMembershipTransactionMutation = () => {
  return useConfirmMutation<{ id: string; reason?: string }, any>(
    {
      mutationFn: ({ id, reason }) => rejectAdminMembershipTransactionApi(id, { reason })
    },
    {
      title: 'Tolak transaksi?',
      description: 'Transaksi membership akan ditolak.',
      confirmText: 'Tolak',
      destructive: true,
      toastMessages: {
        loading: 'Menolak…',
        success: 'Transaksi berhasil ditolak',
        error: 'Gagal menolak transaksi'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useSuspendMembershipTransactionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string; endDate?: string }) =>
      suspendAdminMembershipTransactionApi(vars.id, { reason: vars.reason, endDate: vars.endDate }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'membership-transactions'] });
      toast.success('Membership berhasil ditangguhkan sementara');
    },
    onError: () => toast.error('Gagal menangguhkan membership')
  });
};

export const useUnsuspendMembershipTransactionMutation = () => {
  return useConfirmMutation<string, any>(
    {
      mutationFn: (id: string) => unsuspendAdminMembershipTransactionApi(id)
    },
    {
      title: 'Aktifkan kembali membership?',
      description: 'Membership akan dapat digunakan kembali.',
      confirmText: 'Aktifkan Kembali',
      destructive: false,
      toastMessages: {
        loading: 'Mengaktifkan…',
        success: 'Membership berhasil diaktifkan kembali',
        error: 'Gagal mengaktifkan membership'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useTerminateAndRefundMembershipMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      reason: string;
      refundType: 'FULL' | 'PARTIAL';
      refundAmount?: number;
    }) =>
      terminateAndRefundAdminMembershipTransactionApi(vars.id, {
        reason: vars.reason,
        refundType: vars.refundType,
        refundAmount: vars.refundAmount
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'membership-transactions'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
      ]);
      toast.success('Membership dihentikan dan refund berhasil dicatat');
    },
    onError: () => toast.error('Gagal menghentikan membership dan mencatat refund')
  });
};

export const useTransferMembershipBalanceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; toUserId: string; hours: number; reason: string }) =>
      transferAdminMembershipBalanceApi(vars.id, {
        toUserId: vars.toUserId,
        hours: vars.hours,
        reason: vars.reason
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'membership-transactions'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
        qc.invalidateQueries({ queryKey: ['memberships', 'my'] })
      ]);
      toast.success('Saldo membership berhasil ditransfer');
    },
    onError: (error: any) =>
      toast.error(error?.message || error?.msg || 'Gagal mentransfer saldo membership')
  });
};

export const useExportMembershipTransactionsExcel = () => {
  return useMutation({
    mutationFn: (query: SearchParamsData = {}) => exportAdminMembershipTransactionsExcelApi(query),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `membership-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('File ekspor berhasil dibuat');
    },
    onError: () => toast.error('Gagal mengekspor Excel')
  });
};
