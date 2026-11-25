'use client';

import {
  correctComplimentaryMembershipApi,
  getMembershipCorrectionOptionsApi
} from '@/api/admin/booking';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Booking } from '@/types/model';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function CorrectComplimentaryMembershipDialog({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [membershipUserId, setMembershipUserId] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const options = useQuery({
    queryKey: ['admin', 'bookings', booking.id, 'membership-correction-options'],
    queryFn: () => getMembershipCorrectionOptionsApi(booking.id),
    enabled: open,
    staleTime: 0,
    retry: false
  });
  const selected = options.data?.memberships.find((m) => m.id === membershipUserId);
  const correction = useMutation({
    mutationFn: () =>
      correctComplimentaryMembershipApi(booking.id, { membershipUserId, reason: reason.trim() }),
    onSuccess: () => {
      setOpen(false);
      setReason('');
      setMembershipUserId('');
      // Balances, reports and customer activity all derive from the same corrected details.
      queryClient.invalidateQueries();
      toast.success(
        'Booking dialihkan ke paket berbayar. Kuota gratis yang salah input telah dicabut.'
      );
    },
    onError: (error: unknown) => {
      const message =
        (error as { msg?: string; message?: string }).msg ||
        (error as { message?: string }).message;
      toast.error(message || 'Koreksi gagal. Muat ulang data dan coba lagi.');
      options.refetch();
    }
  });
  if (
    booking.membershipCorrection ||
    !booking.details?.some(
      (d) =>
        !d.cancelledAt &&
        ((d.complimentaryMembershipHours ?? 0) > 0 || d.complimentaryCreditMinutes > 0)
    )
  )
    return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!correction.isPending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="mt-2">
          Alihkan ke paket berbayar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koreksi Pemakaian Complimentary</DialogTitle>
          <DialogDescription>
            Untuk jam gratis yang salah input. Booking tetap pada jadwal semula, lalu kuotanya
            dipotong dari paket berbayar pelanggan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {options.isPending && <p role="status">Memeriksa paket dan kuota…</p>}
          {options.isError && (
            <p role="alert">
              {(options.error as { msg?: string; message?: string }).msg ||
                (options.error as { message?: string }).message ||
                'Paket tidak dapat diperiksa.'}
            </p>
          )}
          {options.data && (
            <>
              <p>
                Complimentary yang dialihkan: <strong>{options.data.hours} jam</strong>
              </p>
              {options.data.memberships.length === 0 ? (
                <p role="alert">
                  Tidak ada paket lunas dengan saldo berbayar yang cukup dan masa berlaku sesuai
                  seluruh jadwal booking ini.
                </p>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor={`correction-package-${booking.id}`}
                    className="text-sm font-medium"
                  >
                    Paket pengganti
                  </label>
                  <Select
                    value={membershipUserId}
                    onValueChange={setMembershipUserId}
                    disabled={correction.isPending}
                  >
                    <SelectTrigger id={`correction-package-${booking.id}`}>
                      <SelectValue placeholder="Pilih paket berbayar" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.data.memberships.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} · {m.invoiceNumber} · {m.paidHours} jam berbayar
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected && (
                    <p className="text-sm">
                      Sisa saldo paket: {selected.remainingHours} →{' '}
                      <strong>{selected.remainingHours - options.data.hours} jam</strong>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          <div className="space-y-2">
            <label
              htmlFor={`membership-correction-reason-${booking.id}`}
              className="text-sm font-medium"
            >
              Alasan koreksi
            </label>
            <Textarea
              id={`membership-correction-reason-${booking.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              disabled={correction.isPending}
              placeholder="Contoh: salah input kuota gratis karena paket lama habis"
            />
          </div>
          <p className="bg-muted p-3 text-xs">
            Kuota gratis yang dipakai akan dicabut, tanpa dikembalikan menjadi saldo gratis. Booking
            berpindah ke kategori membership berbayar pada laporan pemakaian. Penerimaan uang tetap
            berasal dari pembelian paket, sehingga revenue tidak dihitung dua kali. Riwayat koreksi
            disimpan.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={correction.isPending}
            onClick={() => setOpen(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={
              !selected ||
              options.isFetching ||
              options.isError ||
              reason.trim().length < 5 ||
              correction.isPending
            }
            onClick={() => correction.mutate()}
          >
            {correction.isPending
              ? 'Menyimpan…'
              : `Konfirmasi potong ${options.data?.hours ?? 0} jam`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
