import type { MembershipUser } from '@/types/model';

export function getMembershipTransactionStatus(transaction: MembershipUser) {
  if (transaction.incomingTransfer?.cancelledAt) {
    return { label: 'Transfer Dibatalkan', variant: 'destructive' } as const;
  }
  if (transaction.invoice?.payment?.meta?.refund) {
    return { label: 'Dihentikan & Refund', variant: 'destructive' } as const;
  }
  if (transaction.acquisitionType !== 'TRANSFER') {
    const status = transaction.invoice?.status;
    if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'FAILED') {
      return { label: 'Canceled', variant: 'destructive' } as const;
    }
    if (status !== 'PAID') {
      return { label: 'Menunggu Pembayaran', variant: 'lightWarning' } as const;
    }
  }
  if (
    transaction.isExpired ||
    (transaction.endDate && new Date(transaction.endDate).getTime() <= Date.now())
  )
    return { label: 'Kedaluwarsa', variant: 'secondary' } as const;
  if (transaction.isSuspended) return { label: 'Ditangguhkan', variant: 'destructive' } as const;
  if (new Date(transaction.startDate).getTime() > Date.now())
    return { label: 'Menunggu aktif', variant: 'lightInfo' } as const;
  return { label: 'Aktif', variant: 'success' } as const;
}
