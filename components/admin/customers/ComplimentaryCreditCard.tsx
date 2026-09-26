'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  adminGrantComplimentaryCreditMutationOptions,
  adminRevokeComplimentaryCreditMutationOptions
} from '@/mutations/admin/customer';
import { adminCustomerComplimentaryCreditsQueryOptions } from '@/queries/admin/customer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { toast } from 'sonner';

const PURPOSE_LABEL = {
  TRIAL: 'Trial',
  COACHING: 'Coaching',
  GOODWILL: 'Kompensasi',
  OTHER: 'Lainnya'
} as const;

const TRANSACTION_LABEL = {
  GRANT: 'Ditambahkan',
  REDEEM: 'Dipakai',
  REFUND: 'Dikembalikan',
  REVOKE: 'Dicabut'
} as const;

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return `${hours} jam`;
  if (!hours) return `${remainder} menit`;
  return `${hours} jam ${remainder} menit`;
};

export default function ComplimentaryCreditCard({
  customerId,
  canRevoke = true
}: {
  customerId: string;
  canRevoke?: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery(adminCustomerComplimentaryCreditsQueryOptions(customerId));
  const [hours, setHours] = useState('1');
  const [purpose, setPurpose] = useState<keyof typeof PURPOSE_LABEL>('TRIAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ['admin', 'customers', customerId, 'complimentary-credits']
    });

  const grant = useMutation(
    adminGrantComplimentaryCreditMutationOptions({
      onSuccess: () => {
        setHours('1');
        setNote('');
        refresh();
      }
    })
  );
  const revoke = useMutation(adminRevokeComplimentaryCreditMutationOptions({ onSuccess: refresh }));

  const handleGrant = () => {
    const parsedHours = Number(hours);
    const minutes = Math.round(parsedHours * 60);
    if (!Number.isFinite(minutes) || minutes < 30) {
      toast.error('Minimal saldo yang ditambahkan adalah 0,5 jam.');
      return;
    }

    grant.mutate({
      customerId,
      minutes,
      purpose,
      expiresAt: expiresAt ? dayjs(expiresAt).toISOString() : null,
      note: note.trim() || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Jam Gratis</CardTitle>
        <p className="text-muted-foreground text-sm">
          Untuk trial/coaching. Hanya biaya lapangan yang ditanggung dan tidak masuk omzet.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-primary/5 border-primary/20 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Saldo aktif</p>
          <p className="text-primary text-2xl font-bold">
            {formatMinutes(query.data?.totalMinutes ?? 0)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="credit-hours">Jumlah jam</Label>
            <Input
              id="credit-hours"
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-purpose">Tujuan</Label>
            <select
              id="credit-purpose"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value as keyof typeof PURPOSE_LABEL)}
            >
              {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="credit-expiry">Berlaku sampai (opsional)</Label>
            <Input
              id="credit-expiry"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="credit-note">Catatan</Label>
            <Textarea
              id="credit-note"
              maxLength={500}
              placeholder="Contoh: Trial bersama Coach A"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleGrant} loading={grant.isPending}>
          Tambahkan Saldo
        </Button>

        <div className="space-y-2">
          <h4 className="font-semibold">Grant saldo</h4>
          {query.data?.credits.length ? (
            query.data.credits.map((credit) => {
              const usable =
                credit.isActive &&
                credit.remainingMinutes > 0 &&
                (!credit.expiresAt || dayjs(credit.expiresAt).isAfter(dayjs()));
              return (
                <div key={credit.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{PURPOSE_LABEL[credit.purpose]}</span>
                        <Badge variant={usable ? 'success' : 'secondary'}>
                          {usable ? 'Aktif' : 'Tidak aktif'}
                        </Badge>
                      </div>
                      <p className="mt-1">
                        Sisa {formatMinutes(credit.remainingMinutes)} dari{' '}
                        {formatMinutes(credit.grantedMinutes)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {credit.expiresAt
                          ? `Berakhir ${dayjs(credit.expiresAt).format('DD MMM YYYY HH:mm')}`
                          : 'Tanpa tanggal kedaluwarsa'}
                        {' · '}oleh {credit.grantedBy.name}
                      </p>
                      {credit.note && <p className="mt-1 text-xs">{credit.note}</p>}
                    </div>
                    {canRevoke && credit.isActive && credit.remainingMinutes > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={revoke.isPending}
                        onClick={() => {
                          if (window.confirm('Cabut seluruh sisa saldo dari grant ini?')) {
                            revoke.mutate({ customerId, creditId: credit.id });
                          }
                        }}
                      >
                        Cabut
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada saldo jam gratis.</p>
          )}
        </div>

        {!!query.data?.transactions.length && (
          <div className="space-y-2">
            <h4 className="font-semibold">Riwayat terakhir</h4>
            {query.data.transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between gap-3 border-b py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{TRANSACTION_LABEL[transaction.type]}</p>
                  <p className="text-muted-foreground text-xs">
                    {dayjs(transaction.createdAt).format('DD MMM YYYY HH:mm')}
                    {transaction.booking ? ` · Booking ${transaction.booking.id.slice(-6)}` : ''}
                  </p>
                </div>
                <span
                  className={
                    transaction.type === 'GRANT' || transaction.type === 'REFUND'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {transaction.type === 'GRANT' || transaction.type === 'REFUND' ? '+' : '-'}
                  {formatMinutes(transaction.minutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
