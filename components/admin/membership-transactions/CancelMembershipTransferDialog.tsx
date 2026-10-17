'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { MembershipTransfer } from '@/types/model';
import { useCancelMembershipTransferMutation } from '@/mutations/admin/membershipTransaction';
import dayjs from 'dayjs';

export function CancelMembershipTransferDialog({
  transfer,
  membershipUserId,
  isSuperAdmin
}: {
  transfer: MembershipTransfer;
  membershipUserId: string;
  isSuperAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { mutateAsync, isPending } = useCancelMembershipTransferMutation();

  if (transfer.cancelledAt)
    return (
      <div className="mt-3 space-y-1 text-sm">
        <Badge variant="destructive">Dibatalkan</Badge>
        <p>Alasan pembatalan: {transfer.cancellationReason}</p>
        <p className="text-muted-foreground">
          Oleh {transfer.cancelledByAdmin?.name || '-'} ·{' '}
          {dayjs(transfer.cancelledAt).format('DD MMM YYYY HH:mm')}
        </p>
      </div>
    );
  if (!isSuperAdmin) return null;

  async function submit() {
    if (isPending || reason.trim().length < 3) return;
    try {
      await mutateAsync({ id: membershipUserId, transferId: transfer.id, reason: reason.trim() });
      setOpen(false);
      setReason('');
    } catch {
      // The mutation displays the server's validation message.
    }
  }

  return (
    <ManagedDialog
      id={`cancel-transfer-${membershipUserId}-${transfer.id}`}
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        setOpen(value);
        if (!value) setReason('');
      }}
    >
      <DialogTrigger asChild>
        <Button className="mt-3" variant="secondaryDanger" size="sm">
          Batalkan Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Batalkan Transfer Membership?</DialogTitle>
          <DialogDescription>
            Pembatalan penuh dengan pengembalian jam ke pemilik asal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-muted/50 space-y-1 rounded-md border p-3">
            <p>
              Dari: {transfer.fromUser?.name || '-'} (
              {transfer.fromUser?.phone || transfer.fromUserId})
            </p>
            <p>
              Kepada: {transfer.toUser?.name || '-'} ({transfer.toUser?.phone || transfer.toUserId})
            </p>
            <p className="font-medium">
              {transfer.transferredHours} jam akan dikembalikan ke pemilik asal.
            </p>
          </div>
          <p>
            Pembatalan hanya dapat dilakukan jika seluruh jam masih utuh dan tidak terkait booking
            aktif. Masa berlaku membership asal tetap berlaku.
          </p>
          <div>
            <label htmlFor={`cancel-reason-${transfer.id}`} className="mb-1 block font-medium">
              Alasan pembatalan
            </label>
            <Textarea
              id={`cancel-reason-${transfer.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              disabled={isPending}
              placeholder="Alasan wajib diisi, minimal 3 karakter"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={isPending} onClick={() => setOpen(false)}>
              Kembali
            </Button>
            <Button
              variant="secondaryDanger"
              disabled={isPending || reason.trim().length < 3}
              onClick={submit}
            >
              {isPending ? 'Memproses…' : 'Konfirmasi Pembatalan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
}
