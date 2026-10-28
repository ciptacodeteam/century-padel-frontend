'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ManagedDialog
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MembershipUser } from '@/types/model';

export const jakartaDate = (date: Date) =>
  new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

export function RescheduleMembershipStartDialog({
  membership,
  open,
  onOpenChange,
  onSubmit
}: {
  membership: MembershipUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { startDate: string; reason: string }) => Promise<unknown>;
}) {
  const [startDate, setStartDate] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const today = jakartaDate(new Date());
  const start = new Date(`${startDate}T00:00:00+07:00`);
  const durationMs =
    new Date(membership.endDate!).getTime() - new Date(membership.startDate).getTime();
  const end = new Date(start.getTime() + durationMs);
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    startDate >= today &&
    Number.isFinite(start.getTime()) &&
    jakartaDate(start) === startDate &&
    Number.isFinite(end.getTime()) &&
    durationMs > 0;
  const valid = validDate && reason.trim().length >= 3 && reason.trim().length <= 500;
  const dateLabel = (value: Date) =>
    value.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  async function submit() {
    if (!valid || submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      await onSubmit({ startDate, reason: reason.trim() });
      onOpenChange(false);
    } catch {
      // The mutation displays the server error; keep inputs available for retry.
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <ManagedDialog
      id={`membership-start-${membership.id}`}
      open={open}
      onOpenChange={(value) => {
        if (!submitting.current) onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atur Tanggal Mulai</DialogTitle>
          <DialogDescription>
            Jadwalkan aktivasi {membership.membership?.name} untuk {membership.user?.name}. Hanya
            membership lunas yang belum pernah digunakan atau ditransfer yang dapat diubah.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Periode saat ini: {dateLabel(new Date(membership.startDate))} –{' '}
          {dateLabel(new Date(membership.endDate!))}.
        </p>
        <div className="space-y-2">
          <label htmlFor={`start-date-${membership.id}`}>Tanggal mulai aktif (WIB)</label>
          <Input
            id={`start-date-${membership.id}`}
            type="date"
            min={today}
            value={startDate}
            disabled={pending}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        {validDate && (
          <p className="rounded border p-3 text-sm">
            Aktif mulai {dateLabel(start)} pukul 00.00 WIB sampai {dateLabel(end)} pukul{' '}
            {end.toLocaleTimeString('id-ID', {
              timeZone: 'Asia/Jakarta',
              hour: '2-digit',
              minute: '2-digit'
            })}{' '}
            WIB. Durasi tetap {Math.ceil(durationMs / 86_400_000)} hari.
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor={`start-reason-${membership.id}`}>Alasan perubahan</label>
          <Textarea
            id={`start-reason-${membership.id}`}
            value={reason}
            maxLength={500}
            disabled={pending}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: pelanggan meminta mulai tanggal 2"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Benefit dapat digunakan mulai tanggal tersebut. Tanggal pembayaran tetap tercatat sesuai
          transaksi awal.
        </p>
        <Button disabled={!valid || pending} onClick={submit}>
          {pending ? 'Menyimpan…' : 'Simpan Tanggal Mulai'}
        </Button>
      </DialogContent>
    </ManagedDialog>
  );
}
