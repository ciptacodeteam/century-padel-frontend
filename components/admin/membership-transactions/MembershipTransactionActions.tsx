'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ROLE } from '@/lib/constants';
import type { MembershipUser } from '@/types/model';
import {
  CalendarDays,
  Check,
  Eye,
  Gift,
  MoreHorizontal,
  Pause,
  Play,
  ArrowRightLeft,
  Ban,
  X
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRef } from 'react';

export type MembershipAction =
  | 'start-date'
  | 'detail'
  | 'complimentary'
  | 'transfer'
  | 'suspend'
  | 'unsuspend'
  | 'terminate'
  | 'approve'
  | 'reject';
export function MembershipTransactionActions({
  transaction,
  role,
  onAction
}: {
  transaction: MembershipUser;
  role?: string;
  onAction: (action: MembershipAction, transaction: MembershipUser) => void;
}) {
  const openedDialog = useRef(false);
  function choose(action: MembershipAction) {
    openedDialog.current = true;
    onAction(action, transaction);
  }
  const refund = transaction.invoice?.payment?.meta?.refund;
  const funded =
    transaction.acquisitionType === 'TRANSFER'
      ? !transaction.incomingTransfer?.cancelledAt
      : transaction.invoice?.status === 'PAID';
  const now = dayjs();
  const current =
    dayjs(transaction.startDate).valueOf() <= now.valueOf() &&
    dayjs(transaction.endDate).isAfter(now);
  const grant =
    role === ROLE.ADMIN &&
    funded &&
    !transaction.isSuspended &&
    !refund &&
    (!transaction.isExpired || transaction.remainingSessions === 0) &&
    current;
  const transfer =
    role === ROLE.ADMIN &&
    transaction.acquisitionType === 'PURCHASE' &&
    transaction.invoice?.status === 'PAID' &&
    !transaction.isExpired &&
    !transaction.isSuspended &&
    transaction.remainingSessions - (transaction.remainingComplimentarySessions ?? 0) > 0 &&
    !refund &&
    dayjs(transaction.endDate).isAfter(now);
  const suspend = funded && !transaction.isSuspended && !transaction.isExpired;
  const unsuspend = funded && transaction.isSuspended && !transaction.isExpired;
  const terminate =
    transaction.acquisitionType === 'PURCHASE' &&
    transaction.invoice?.status === 'PAID' &&
    !transaction.isExpired &&
    !refund &&
    !transaction.outgoingTransfers?.length;
  const reschedule =
    role === ROLE.ADMIN &&
    transaction.acquisitionType === 'PURCHASE' &&
    funded &&
    !refund &&
    !transaction.isExpired &&
    !transaction.isSuspended &&
    dayjs(transaction.endDate).isAfter(now) &&
    transaction.remainingSessions ===
      (transaction.membership?.sessions ?? 0) + (transaction.totalComplimentarySessions ?? 0) &&
    (transaction.remainingComplimentarySessions ?? 0) ===
      (transaction.totalComplimentarySessions ?? 0) &&
    transaction._count?.bookingDetails === 0 &&
    transaction._count?.outgoingTransfers === 0;
  const pending = transaction.invoice?.status === 'PENDING';
  const hasActions =
    reschedule || grant || transfer || suspend || unsuspend || terminate || pending;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-10 gap-2 md:h-9"
        onClick={() => onAction('detail', transaction)}
      >
        <Eye className="size-4" />
        Detail
      </Button>
      {hasActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="size-10 md:size-9"
              aria-label={`Tindakan membership ${transaction.user?.name || transaction.membership?.name || ''}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Kelola membership
            </DropdownMenuLabel>
            {pending && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('approve')}>
                <Check />
                Setujui Pembayaran
              </DropdownMenuItem>
            )}
            {reschedule && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('start-date')}>
                <CalendarDays />
                Atur Tanggal Mulai
              </DropdownMenuItem>
            )}
            {grant && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('complimentary')}>
                <Gift />
                Tambah Kuota Complimentary
              </DropdownMenuItem>
            )}
            {transfer && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('transfer')}>
                <ArrowRightLeft />
                Transfer Saldo
              </DropdownMenuItem>
            )}
            {suspend && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('suspend')}>
                <Pause />
                Tangguhkan Sementara
              </DropdownMenuItem>
            )}
            {unsuspend && (
              <DropdownMenuItem className="min-h-10" onSelect={() => choose('unsuspend')}>
                <Play />
                Aktifkan Kembali
              </DropdownMenuItem>
            )}
            {(terminate || pending) && <DropdownMenuSeparator />}
            {pending && (
              <DropdownMenuItem
                className="min-h-10"
                variant="destructive"
                onSelect={() => choose('reject')}
              >
                <X />
                Tolak Pembayaran
              </DropdownMenuItem>
            )}
            {terminate && (
              <DropdownMenuItem
                className="min-h-10"
                variant="destructive"
                onSelect={() => choose('terminate')}
              >
                <Ban />
                Hentikan & Refund
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
