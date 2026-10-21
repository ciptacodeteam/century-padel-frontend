'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MembershipUser } from '@/types/model';
import dayjs from 'dayjs';

type Payload = { hours: number; reason: string; requestId: string };
export function GrantMembershipComplimentaryDialog({
  membership,
  onGrant
}: {
  membership: MembershipUser;
  onGrant: (payload: Payload) => Promise<unknown>;
}) {
  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const submitting = React.useRef(false);
  // Keep the same key after network failures, including close/reopen. A retry
  // cannot accidentally grant twice when the server committed the first request.
  const attempt = React.useRef<Payload | null>(null);
  const valid =
    Number.isInteger(Number(hours)) &&
    Number(hours) >= 1 &&
    Number(hours) <= 10000 &&
    reason.trim().length >= 3 &&
    reason.trim().length <= 500;
  const locked = pending || !!attempt.current;
  async function submit() {
    if (submitting.current || (!attempt.current && !valid)) return;
    submitting.current = true;
    setPending(true);
    try {
      const payload = attempt.current ?? {
        hours: Number(hours),
        reason: reason.trim(),
        requestId: crypto.randomUUID()
      };
      attempt.current = payload;
      await onGrant(payload);
      attempt.current = null;
      setHours('');
      setReason('');
      setOpen(false);
    } catch (error) {
      // A definitive client error did not commit a grant; allow corrections.
      const code = (error as { code?: number })?.code;
      if (typeof code === 'number' && code >= 400 && code < 500 && code !== 408)
        attempt.current = null;
      // Ambiguous network/server failures must retry the same request ID.
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <ManagedDialog
      id={`complimentary-membership-${membership.id}`}
      open={open}
      onOpenChange={(value) => {
        if (!submitting.current) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Tambah Kuota Complimentary
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Kuota Complimentary</DialogTitle>
          <DialogDescription>
            Tambahkan jam bermain untuk {membership.user?.name}. Kuota ini tidak menambah revenue
            dan tidak memperpanjang masa aktif membership.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {membership.membership?.name} · Berlaku sampai{' '}
          {dayjs(membership.endDate).format('DD MMM YYYY')}
        </p>
        <div className="space-y-2">
          <label htmlFor={`complimentary-hours-${membership.id}`}>Jumlah kuota (jam)</label>
          <Input
            id={`complimentary-hours-${membership.id}`}
            type="number"
            min={1}
            max={10000}
            step={1}
            value={hours}
            disabled={locked}
            onChange={(event) => setHours(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`complimentary-reason-${membership.id}`}>Alasan pemberian</label>
          <Textarea
            id={`complimentary-reason-${membership.id}`}
            maxLength={500}
            value={reason}
            disabled={locked}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: kompensasi gangguan lapangan"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Complimentary dipakai lebih dulu dan mengikuti aturan jam paket. Kuota ini tidak dapat
          ditransfer.
        </p>
        {attempt.current && !pending && (
          <p className="text-sm">
            Permintaan belum terkonfirmasi. Coba kembali untuk memeriksa hasilnya tanpa menambah
            kuota dua kali.
          </p>
        )}
        <Button disabled={pending || (!attempt.current && !valid)} onClick={submit}>
          {pending ? 'Menyimpan…' : attempt.current ? 'Coba Kembali' : 'Tambah Kuota'}
        </Button>
      </DialogContent>
    </ManagedDialog>
  );
}
