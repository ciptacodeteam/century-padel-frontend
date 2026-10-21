'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getMembershipTransactionStatus } from '@/lib/membership-transaction-status';
import { formatCurrency } from '@/lib/utils';
import type { MembershipUser } from '@/types/model';
import dayjs from 'dayjs';
import {
  MembershipTransactionActions,
  type MembershipAction
} from './MembershipTransactionActions';

export function MembershipTransactionCard({
  transaction,
  role,
  onAction
}: {
  transaction: MembershipUser;
  role?: string;
  onAction: (action: MembershipAction, transaction: MembershipUser) => void;
}) {
  const status = getMembershipTransactionStatus(transaction);
  const complimentary = transaction.remainingComplimentarySessions ?? 0;
  const transfer = transaction.acquisitionType === 'TRANSFER';
  const refund = transaction.invoice?.payment?.meta?.refund;
  const name = transaction.user?.name || 'Pelanggan';
  return (
    <article
      className="bg-card min-w-0 overflow-hidden rounded-xl border shadow-xs"
      aria-label={`Membership ${name}`}
    >
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={transaction.user?.image || undefined} alt="" />
            <AvatarFallback>
              {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold wrap-anywhere">{name}</p>
            <p className="text-muted-foreground mt-0.5 text-xs wrap-anywhere">
              {transaction.user?.phone || '—'}
            </p>
          </div>
          <Badge
            variant={status.variant}
            className="max-w-36 shrink-0 text-right whitespace-normal"
          >
            {status.label}
          </Badge>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm leading-5 font-semibold wrap-anywhere">
            {transaction.membership?.name || 'Membership'}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {transfer ? 'Saldo transfer' : 'Pembelian'} · {transaction.membership?.sessions || 0}{' '}
            jam / {transaction.membership?.duration || 0} hari
          </p>
        </div>
        <div className="bg-muted/50 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 rounded-lg p-3">
          <div>
            <p className="text-muted-foreground text-xs">Sisa kuota</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {transaction.remainingSessions}
              <span className="ml-1 text-xs font-normal">jam</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Berlaku sampai</p>
            <p className="mt-1 text-sm font-medium">
              {transaction.endDate ? dayjs(transaction.endDate).format('DD MMM YYYY') : '—'}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Mulai {dayjs(transaction.startDate).format('DD MMM YYYY')}
            </p>
          </div>
          {(transaction.totalComplimentarySessions ?? 0) > 0 && (
            <p className="text-muted-foreground col-span-2 border-t pt-2 text-xs leading-5">
              Berbayar/transfer: {transaction.remainingSessions - complimentary} jam ·
              Complimentary: {complimentary} jam
            </p>
          )}
        </div>
        {transaction.invoice && (
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground min-w-0 font-mono wrap-anywhere">
              {transaction.invoice.number}
            </span>
            <div className="min-w-0 text-right">
              <p className="text-foreground text-sm font-semibold tabular-nums">
                {formatCurrency(transaction.invoice.total)}
              </p>
              {transaction.invoice.payment && (
                <p className="text-muted-foreground mt-1 wrap-anywhere">
                  {transaction.invoice.payment.method.name}
                </p>
              )}
              {refund && (
                <p className="text-destructive mt-1">Refund {formatCurrency(refund.amount)}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">
          {transfer
            ? 'Tanpa transaksi pembelian'
            : transaction.invoice?.status === 'PAID'
              ? 'Pembayaran lunas'
              : 'Transaksi membership'}
        </p>
        <MembershipTransactionActions transaction={transaction} role={role} onAction={onAction} />
      </div>
    </article>
  );
}
