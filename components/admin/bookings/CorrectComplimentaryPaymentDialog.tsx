'use client';

import { correctComplimentaryPaymentApi } from '@/api/admin/booking';
import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import type { Booking } from '@/types/model';
import { IconCash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function CorrectComplimentaryPaymentDialog({
  booking,
  onSuccess
}: {
  booking: Booking;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const coveredDetails = useMemo(
    () =>
      (booking.details ?? []).filter(
        (detail) => !detail.cancelledAt && detail.complimentaryCreditMinutes > 0
      ),
    [booking.details]
  );
  const amount = coveredDetails.reduce(
    (total, detail) =>
      total + ((detail.discountPrice || 0) > 0 ? detail.discountPrice! : detail.price),
    0
  );
  const minutes = coveredDetails.reduce(
    (total, detail) => total + detail.complimentaryCreditMinutes,
    0
  );

  const correction = useMutation({
    mutationFn: () =>
      correctComplimentaryPaymentApi(booking.id, {
        paymentDate: dayjs(paymentDate).format('YYYY-MM-DD'),
        reason: reason.trim()
      }),
    onSuccess: () => {
      toast.success('Pembayaran berhasil dikoreksi menjadi transaksi Kasir.');
      setOpen(false);
      setReason('');
      setPaymentDate(new Date());
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Koreksi pembayaran gagal dilakukan.');
    }
  });

  if (amount <= 0 || minutes <= 0) return null;

  const hours = minutes / 60;
  const valid = Boolean(paymentDate) && reason.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="mt-2">
          <IconCash className="size-4" />
          Koreksi pembayaran
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koreksi Menjadi Pembayaran Kasir</DialogTitle>
          <DialogDescription>
            Gunakan hanya jika pembayaran benar-benar telah diterima dari pelanggan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 grid grid-cols-2 gap-3 border p-3 text-sm">
            <div>
              <p className="text-muted-foreground">Saldo dikembalikan</p>
              <p className="font-medium">{hours} jam</p>
            </div>
            <div>
              <p className="text-muted-foreground">Revenue Kasir</p>
              <p className="font-medium">{formatCurrency(amount)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal pembayaran</label>
            <DatePickerInput
              value={paymentDate}
              onValueChange={(date) => setPaymentDate(date ?? null)}
              minDate={dayjs(booking.createdAt).startOf('day').toDate()}
              maxDate={new Date()}
            />
            <p className="text-muted-foreground text-xs">
              Revenue akan masuk ke laporan pada tanggal ini.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`payment-correction-reason-${booking.id}`}
              className="text-sm font-medium"
            >
              Alasan koreksi
            </label>
            <Textarea
              id={`payment-correction-reason-${booking.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: pelanggan sebenarnya membayar langsung di kasir"
              maxLength={500}
            />
          </div>

          <div className="border-primary/20 bg-primary/5 border p-3 text-xs">
            Setelah dikonfirmasi, saldo gratis dikembalikan, invoice menjadi{' '}
            {formatCurrency(amount)}, dan transaksi dicatat sebagai Kasir. Koreksi ini tidak dapat
            dilakukan dua kali.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={!valid || correction.isPending}
            onClick={() => correction.mutate()}
          >
            {correction.isPending ? 'Menyimpan…' : 'Konfirmasi koreksi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
