'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { PAYMENT_STATUS_BADGE_VARIANT, PAYMENT_STATUS_MAP, ROLE } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { adminMembershipTransactionsQueryOptions } from '@/queries/admin/membershipTransaction';
import type { MembershipUser } from '@/types/model';
import { IconEye, IconFileExcel } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import * as React from 'react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  useApproveMembershipTransactionMutation,
  useRejectMembershipTransactionMutation,
  useSuspendMembershipTransactionMutation,
  useTerminateAndRefundMembershipMutation,
  useUnsuspendMembershipTransactionMutation,
  useExportMembershipTransactionsExcel
} from '@/mutations/admin/membershipTransaction';
import { Input } from '@/components/ui/input';
import DatePickerInput from '@/components/ui/date-picker-input';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { TransferMembershipBalanceDialog } from './TransferMembershipBalanceDialog';
import { useTransferMembershipBalanceMutation } from '@/mutations/admin/membershipTransaction';

const columnHelper = createColumnHelper<MembershipUser>();

const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD MMM YYYY');
};

const getMembershipRefund = (transaction: MembershipUser) =>
  transaction.invoice?.payment?.meta?.refund;

const MembershipTransactionTable = () => {
  const [source, setSource] = useState<string>('');
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { data: transactions = [], isLoading } = useQuery(
    adminMembershipTransactionsQueryOptions(source && source !== 'all' ? { source } : {})
  );

  const { confirmAndMutate: approveTx } = useApproveMembershipTransactionMutation();
  const { confirmAndMutate: rejectTx } = useRejectMembershipTransactionMutation();
  const { mutate: suspendTx } = useSuspendMembershipTransactionMutation();
  const { confirmAndMutate: unsuspendTx } = useUnsuspendMembershipTransactionMutation();
  const { mutate: terminateAndRefundTx } = useTerminateAndRefundMembershipMutation();
  const { mutateAsync: transferBalance } = useTransferMembershipBalanceMutation();
  const { mutate: exportExcel, isPending: exporting } = useExportMembershipTransactionsExcel();

  const columns = useMemo(
    () => [
      columnHelper.accessor('user', {
        header: 'Pelanggan',
        cell: (info) => {
          const user = info.getValue();
          if (!user) return '-';

          const name = user.name || '-';
          const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || undefined} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-muted-foreground text-xs">{user.phone}</p>
              </div>
            </div>
          );
        },
        size: 250
      }),
      columnHelper.accessor('membership', {
        header: 'Membership',
        cell: (info) => {
          const membership = info.getValue();
          if (!membership) return '-';

          return (
            <div>
              <p className="font-medium">{membership.name}</p>
              <p className="text-muted-foreground text-xs">
                {membership.sessions} jam · {membership.duration} hari
              </p>
              {info.row.original.acquisitionType === 'TRANSFER' && (
                <Badge variant="lightInfo" className="mt-1 w-fit">
                  Saldo Transfer
                </Badge>
              )}
            </div>
          );
        },
        size: 200
      }),
      columnHelper.accessor('invoice', {
        header: 'Invoice',
        cell: (info) => {
          const invoice = info.getValue();
          if (!invoice && info.row.original.acquisitionType === 'TRANSFER') {
            return <Badge variant="lightInfo">Transfer</Badge>;
          }
          if (!invoice) return '-';

          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{invoice.number}</span>
              <CopyButton variant={'ghost'} size={'sm'} value={invoice.number} />
            </div>
          );
        },
        size: 180
      }),
      columnHelper.accessor('startDate', {
        header: 'Periode',
        cell: (info) => {
          const row = info.row.original;

          return (
            <div className="text-sm">
              <p className="font-medium">{formatDate(row.startDate)}</p>
              <p className="text-muted-foreground text-xs">
                s.d. {row.endDate ? formatDate(row.endDate) : '-'}
              </p>
            </div>
          );
        },
        size: 160
      }),
      columnHelper.accessor('remainingSessions', {
        header: 'Sisa',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="text-sm">
              <p>{info.getValue()} jam</p>
              <p className="text-muted-foreground text-xs">{row.remainingDuration} hari</p>
            </div>
          );
        },
        size: 120
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const row = info.row.original;
          const refund = getMembershipRefund(row);

          return (
            <div className="flex flex-col gap-1">
              {refund && (
                <Badge variant="destructive" className="w-fit">
                  Dihentikan & Refund
                </Badge>
              )}
              {row.acquisitionType === 'TRANSFER' && (
                <Badge variant="lightInfo" className="w-fit">
                  Saldo Transfer
                </Badge>
              )}
              {!refund && row.isSuspended && (
                <Badge variant="destructive" className="w-fit">
                  Ditangguhkan
                </Badge>
              )}
              {!refund && row.isExpired && (
                <Badge variant="secondary" className="w-fit">
                  Kedaluwarsa
                </Badge>
              )}
              {!row.isSuspended && !row.isExpired && (
                <Badge variant="success" className="w-fit">
                  Aktif
                </Badge>
              )}
              {row.invoice?.status && (
                <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[row.invoice.status]} className="w-fit">
                  {PAYMENT_STATUS_MAP[row.invoice.status]}
                </Badge>
              )}
            </div>
          );
        },
        size: 120
      }),
      columnHelper.display({
        id: 'amount',
        header: 'Nominal',
        cell: (info) => {
          const invoice = info.row.original.invoice;
          if (!invoice && info.row.original.acquisitionType === 'TRANSFER') {
            return <span className="text-muted-foreground text-xs">Tidak menambah revenue</span>;
          }
          if (!invoice) return '-';

          return (
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(invoice.total)}</p>
              {getMembershipRefund(info.row.original) && (
                <p className="text-destructive text-xs">
                  Refund {formatCurrency(getMembershipRefund(info.row.original)?.amount || 0)}
                </p>
              )}
              {invoice.payment && (
                <p className="text-muted-foreground text-xs">via {invoice.payment.method.name}</p>
              )}
            </div>
          );
        },
        size: 140
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Tindakan',
        cell: (info) => {
          const transaction = info.row.original;
          const canApproveOrReject = transaction.invoice?.status === 'PENDING';
          const refund = getMembershipRefund(transaction);
          const canTerminateAndRefund =
            transaction.acquisitionType === 'PURCHASE' &&
            transaction.invoice?.status === 'PAID' &&
            !transaction.isExpired &&
            !refund &&
            !transaction.outgoingTransfers?.length;
          const canTransfer =
            me?.role === ROLE.ADMIN &&
            transaction.acquisitionType === 'PURCHASE' &&
            transaction.invoice?.status === 'PAID' &&
            !transaction.isExpired &&
            !transaction.isSuspended &&
            transaction.remainingSessions > 0 &&
            !refund &&
            dayjs(transaction.endDate).isAfter(dayjs());

          return (
            <div className="flex gap-2">
              <ManagedDialog id={`membership-detail-${transaction.id}`}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconEye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detail Transaksi Membership</DialogTitle>
                  </DialogHeader>
                  <MembershipTransactionDetail transaction={transaction} />
                </DialogContent>
              </ManagedDialog>

              {canApproveOrReject && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondarySuccess"
                    onClick={() => approveTx(transaction.id)}
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="secondaryDanger"
                    onClick={() => rejectTx({ id: transaction.id })}
                  >
                    Tolak
                  </Button>
                </div>
              )}

              {!transaction.isSuspended && !transaction.isExpired && (
                <SuspendMembershipDialog
                  dialogId={transaction.id}
                  onSubmit={(reason, endDate) =>
                    suspendTx({ id: transaction.id, reason, endDate: endDate ?? undefined })
                  }
                />
              )}
              {transaction.isSuspended && !transaction.isExpired && (
                <Button size="sm" variant="outline" onClick={() => unsuspendTx(transaction.id)}>
                  Aktifkan Kembali
                </Button>
              )}
              {canTerminateAndRefund && (
                <TerminateAndRefundMembershipDialog
                  dialogId={transaction.id}
                  invoiceTotal={transaction.invoice?.total || 0}
                  onSubmit={(payload) => terminateAndRefundTx({ id: transaction.id, ...payload })}
                />
              )}
              {canTransfer && (
                <TransferMembershipBalanceDialog
                  membership={transaction}
                  onTransfer={(payload) => transferBalance({ id: transaction.id, ...payload })}
                />
              )}
            </div>
          );
        },
        size: 100
      })
    ],
    [approveTx, me?.role, rejectTx, suspendTx, terminateAndRefundTx, transferBalance, unsuspendTx]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={transactions}
        loading={isLoading}
        rightActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="source-filter" className="text-sm font-medium">
                Filter Sumber:
              </label>
              <Select value={source || 'all'} onValueChange={setSource}>
                <SelectTrigger id="source-filter" className="w-[180px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportExcel({})}
              disabled={exporting}
            >
              <IconFileExcel />
              {exporting ? 'Mengekspor…' : 'Ekspor Excel'}
            </Button>
          </div>
        }
      />
    </div>
  );
};

const MembershipTransactionDetail = ({ transaction }: { transaction: MembershipUser }) => {
  const { user, membership, invoice } = transaction;
  const refund = getMembershipRefund(transaction);

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Informasi Pelanggan</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Nama</p>
            <p className="font-medium">{user?.name || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Nomor Telepon</p>
            <p className="font-medium">{user?.phone || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{user?.email || '-'}</p>
          </div>
        </div>
      </div>

      {/* Membership Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Detail Membership</h3>
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">Paket</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{membership?.name || '-'}</p>
              {transaction.acquisitionType === 'TRANSFER' && (
                <Badge variant="lightInfo">Saldo Transfer</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{membership?.description || ''}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Jam Paket</p>
              <p className="font-medium">{membership?.sessions || 0} jam</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Durasi</p>
              <p className="font-medium">{membership?.duration || 0} hari</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Harga</p>
              <p className="font-medium">{formatCurrency(membership?.price || 0)}</p>
            </div>
          </div>
          {membership?.benefits && membership.benefits.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm">Benefit</p>
              <ul className="list-inside list-disc space-y-1">
                {membership.benefits.map((benefit) => (
                  <li key={benefit.id} className="text-sm">
                    {benefit.benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Informasi Transaksi</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Tanggal Mulai</p>
            <p className="font-medium">{formatDate(transaction.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tanggal Berakhir</p>
            <p className="font-medium">
              {transaction.endDate ? formatDate(transaction.endDate) : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Sisa Jam</p>
            <p className="font-medium">{transaction.remainingSessions} jam</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Sisa Durasi</p>
            <p className="font-medium">{transaction.remainingDuration} hari</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Sumber Saldo</p>
            <p className="font-medium">
              {transaction.acquisitionType === 'TRANSFER' ? 'Transfer member' : 'Pembelian'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Status</p>
            <div className="flex gap-2">
              {refund && <Badge variant="destructive">Dihentikan & Refund</Badge>}
              {!refund && transaction.isSuspended && (
                <Badge variant="destructive">Ditangguhkan</Badge>
              )}
              {!refund && transaction.isExpired && <Badge variant="secondary">Kedaluwarsa</Badge>}
              {!transaction.isSuspended && !transaction.isExpired && (
                <Badge variant="success">Aktif</Badge>
              )}
            </div>
          </div>
          {transaction.isSuspended && (
            <>
              <div>
                <p className="text-muted-foreground text-sm">
                  {refund ? 'Alasan Penghentian' : 'Alasan Penangguhan'}
                </p>
                <p className="font-medium">{transaction.suspensionReason || '-'}</p>
              </div>
              {transaction.suspensionEndDate && (
                <div>
                  <p className="text-muted-foreground text-sm">Batas Penangguhan</p>
                  <p className="font-medium">{formatDate(transaction.suspensionEndDate)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {transaction.incomingTransfer && (
        <div className="border-info/30 bg-info/5 rounded-lg border p-4">
          <h3 className="font-semibold">Transfer Masuk</h3>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Dari</p>
              <p className="font-medium">{transaction.incomingTransfer.fromUser?.name || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Jumlah</p>
              <p className="font-medium">{transaction.incomingTransfer.transferredHours} jam</p>
            </div>
            <div>
              <p className="text-muted-foreground">Diproses oleh</p>
              <p className="font-medium">
                {transaction.incomingTransfer.transferredByAdmin?.name || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tanggal</p>
              <p className="font-medium">
                {dayjs(transaction.incomingTransfer.createdAt).format('DD MMM YYYY HH:mm')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Alasan</p>
              <p className="font-medium">{transaction.incomingTransfer.reason}</p>
            </div>
          </div>
        </div>
      )}

      {!!transaction.outgoingTransfers?.length && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Riwayat Transfer Keluar</h3>
          <div className="mt-3 space-y-3">
            {transaction.outgoingTransfers.map((transfer) => (
              <div key={transfer.id} className="bg-muted/50 rounded-md p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">
                    {transfer.transferredHours} jam → {transfer.toUser?.name || '-'}
                  </p>
                  <p className="text-muted-foreground">
                    {dayjs(transfer.createdAt).format('DD MMM YYYY HH:mm')}
                  </p>
                </div>
                <p className="text-muted-foreground mt-1">Alasan: {transfer.reason}</p>
                <p className="text-muted-foreground text-xs">
                  Oleh {transfer.transferredByAdmin?.name || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Info */}
      {invoice && (
        <div>
          <h3 className="mb-3 font-semibold">Informasi Pembayaran</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Nomor Invoice</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">{invoice.number}</p>
                <CopyButton variant={'ghost'} size={'sm'} value={invoice.number} />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Status Pembayaran</p>
              <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[invoice.status]}>
                {PAYMENT_STATUS_MAP[invoice.status]}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Pembayaran</p>
              <p className="text-lg font-semibold">{formatCurrency(invoice.total)}</p>
            </div>
            {invoice.payment && (
              <>
                <div>
                  <p className="text-muted-foreground text-sm">Metode Pembayaran</p>
                  <p className="font-medium">{invoice.payment.method.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Biaya Pembayaran</p>
                  <p className="font-medium">{formatCurrency(invoice.payment.fee)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Reference ID</p>
                  <p className="font-mono text-sm">{invoice.payment.referenceId}</p>
                </div>
              </>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground text-sm">Paid At</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
            {refund && (
              <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3 md:col-span-2">
                <p className="text-destructive font-medium">
                  Refund {refund.type === 'FULL' ? 'Penuh' : 'Sebagian'} ·{' '}
                  {formatCurrency(refund.amount)}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">Alasan: {refund.reason}</p>
                <p className="text-muted-foreground text-xs">
                  Dicatat {dayjs(refund.refundedAt).format('DD MMM YYYY HH:mm')}
                </p>
              </div>
            )}
            {invoice.expiresAt && invoice.status === 'PENDING' && (
              <div>
                <p className="text-muted-foreground text-sm">Expires At</p>
                <p className="font-medium">{formatDate(invoice.expiresAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4">
        <div className="text-muted-foreground grid gap-2 text-xs">
          <p>Dibuat: {dayjs(transaction.createdAt).format('DD MMM YYYY HH:mm')}</p>
          <p>Diperbarui: {dayjs(transaction.updatedAt).format('DD MMM YYYY HH:mm')}</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipTransactionTable;

const SuspendMembershipDialog = ({
  dialogId,
  onSubmit
}: {
  dialogId: string;
  onSubmit: (reason: string, endDate?: string | null) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [endDate, setEndDate] = React.useState<Date | null | undefined>(undefined);

  function handleSubmit() {
    if (!reason.trim()) return;
    onSubmit(reason.trim(), endDate ? endDate.toISOString() : undefined);
    setOpen(false);
    setReason('');
    setEndDate(undefined);
  }

  return (
    <ManagedDialog id={`suspend-membership-${dialogId}`} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Tangguhkan Sementara
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tangguhkan Membership Sementara</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">Alasan penangguhan</p>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: permintaan pelanggan"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Batas penangguhan (opsional)</p>
            <DatePickerInput value={endDate ?? null} onValueChange={setEndDate} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!reason.trim()}>
              Tangguhkan Sementara
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
};

const TerminateAndRefundMembershipDialog = ({
  dialogId,
  invoiceTotal,
  onSubmit
}: {
  dialogId: string;
  invoiceTotal: number;
  onSubmit: (payload: {
    reason: string;
    refundType: 'FULL' | 'PARTIAL';
    refundAmount?: number;
  }) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [refundType, setRefundType] = React.useState<'FULL' | 'PARTIAL'>('FULL');
  const [refundAmount, setRefundAmount] = React.useState('');

  const partialAmount = Number(refundAmount);
  const isValid =
    reason.trim().length >= 3 &&
    (refundType === 'FULL' ||
      (Number.isInteger(partialAmount) && partialAmount > 0 && partialAmount <= invoiceTotal));

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({
      reason: reason.trim(),
      refundType,
      refundAmount: refundType === 'PARTIAL' ? partialAmount : undefined
    });
    setOpen(false);
    setReason('');
    setRefundType('FULL');
    setRefundAmount('');
  }

  return (
    <ManagedDialog
      id={`terminate-refund-membership-${dialogId}`}
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondaryDanger">
          Hentikan & Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hentikan Membership & Refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3 text-sm">
            <p className="font-medium">Tindakan ini bersifat permanen.</p>
            <p className="text-muted-foreground mt-1">
              Membership tidak dapat diaktifkan kembali. Pastikan dana sudah dikembalikan kepada
              pelanggan karena sistem akan mencatat refund sebagai selesai.
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Jenis refund</p>
            <Select
              value={refundType}
              onValueChange={(value) => setRefundType(value as 'FULL' | 'PARTIAL')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL">Refund penuh ({formatCurrency(invoiceTotal)})</SelectItem>
                <SelectItem value="PARTIAL">Refund sebagian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {refundType === 'PARTIAL' && (
            <div>
              <p className="mb-1 text-sm font-medium">Nominal refund</p>
              <Input
                type="number"
                min={1}
                max={invoiceTotal}
                step={1}
                value={refundAmount}
                onChange={(event) => setRefundAmount(event.target.value)}
                placeholder={`Maksimal ${formatCurrency(invoiceTotal)}`}
              />
              {partialAmount > invoiceTotal && (
                <p className="text-destructive mt-1 text-xs">
                  Nominal tidak boleh melebihi total pembayaran.
                </p>
              )}
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-medium">Alasan penghentian dan refund</p>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: refund atas permintaan pelanggan"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={!isValid}>
              Hentikan & Catat Refund
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
};
