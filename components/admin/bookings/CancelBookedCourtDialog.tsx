'use client';

import { cancelBookedCourtApi } from '@/api/admin/bookedCourt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import type { BookingDetail } from '@/types/model';
import { IconX } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  detail: BookingDetail;
  maximumRefund: number;
  onSuccess: () => void;
};

export function CancelBookedCourtDialog({ detail, maximumRefund, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const suggestedRefund = detail.membershipUserId
    ? 0
    : Math.min(
        detail.discountPrice && detail.discountPrice > 0 ? detail.discountPrice : detail.price,
        maximumRefund
      );
  const [refundAmount, setRefundAmount] = useState(String(suggestedRefund));
  const numericRefund = Number(refundAmount);
  const isValid =
    reason.trim().length >= 3 &&
    Number.isInteger(numericRefund) &&
    numericRefund >= 0 &&
    numericRefund <= maximumRefund;

  const mutation = useMutation({
    mutationFn: () =>
      cancelBookedCourtApi(detail.id, {
        reason: reason.trim(),
        refundAmount: numericRefund
      }),
    onSuccess: () => {
      toast.success('Lapangan dibatalkan dan refund berhasil dicatat.');
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || error?.msg || 'Gagal membatalkan lapangan.');
    }
  });

  if (detail.cancelledAt) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="destructive">Dibatalkan</Badge>
        <span className="text-muted-foreground text-xs">
          Refund {formatCurrency(detail.refundAmount || 0)}
        </span>
      </div>
    );
  }

  return (
    <ManagedDialog id={`cancel-booked-court-${detail.id}`} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondaryDanger">
          <IconX className="mr-1 size-4" />
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan Lapangan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3 text-sm">
            <p className="font-medium">Pembatalan force majeure per lapangan</p>
            <p className="text-muted-foreground mt-1">
              Slot akan tersedia kembali dan refund yang dicatat langsung mengurangi revenue.
              Pastikan dana sudah dikembalikan kepada pelanggan karena sistem hanya mencatat refund,
              bukan mengirim dana otomatis.
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Nominal refund</p>
            <Input
              type="number"
              min={0}
              max={maximumRefund}
              step={1}
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Maksimal sisa refund: {formatCurrency(maximumRefund)}. Isi 0 jika slot menggunakan
              membership atau tidak ada pengembalian uang.
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Alasan pembatalan</p>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: lapangan tidak dapat digunakan karena hujan deras"
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
            >
              {mutation.isPending ? 'Memproses...' : 'Batalkan & Catat Refund'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
}
