'use client';

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
import { formatPhone } from '@/lib/utils';
import {
  adminCustomerSearchQueryOptions,
  type CustomerSearchResult
} from '@/queries/admin/customer';
import type { MembershipUser } from '@/types/model';
import { IconTransfer } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as React from 'react';

type Props = {
  membership: MembershipUser;
  onTransfer: (payload: { toUserId: string; hours: number; reason: string }) => Promise<unknown>;
};

export function TransferMembershipBalanceDialog({ membership, onTransfer }: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [recipient, setRecipient] = React.useState<CustomerSearchResult | null>(null);
  const [hours, setHours] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: searchResults = [], isFetching } = useQuery(
    adminCustomerSearchQueryOptions({ q: debouncedSearch, limit: '10' })
  );
  const availableRecipients = searchResults.filter((item) => item.id !== membership.userId);
  const numericHours = Number(hours);
  const isValid =
    !!recipient &&
    Number.isInteger(numericHours) &&
    numericHours > 0 &&
    numericHours <= membership.remainingSessions &&
    reason.trim().length >= 3;

  function reset() {
    setSearch('');
    setDebouncedSearch('');
    setRecipient(null);
    setHours('');
    setReason('');
  }

  async function handleSubmit() {
    if (!isValid || !recipient) return;
    setIsSubmitting(true);
    try {
      await onTransfer({
        toUserId: recipient.id,
        hours: numericHours,
        reason: reason.trim()
      });
      setOpen(false);
      reset();
    } catch {
      // The mutation owns the user-facing error toast; keep the dialog open.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ManagedDialog
      id={`transfer-membership-${membership.id}`}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen && !isSubmitting) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <IconTransfer className="mr-1 size-4" />
          Transfer Saldo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Saldo Membership</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-3 text-sm">
            <p className="font-medium">{membership.membership?.name}</p>
            <p className="text-muted-foreground mt-1">
              Pemilik: {membership.user?.name} · Saldo tersedia: {membership.remainingSessions} jam
            </p>
            <p className="text-muted-foreground">
              Saldo penerima berakhir pada {dayjs(membership.endDate).format('DD MMM YYYY')} dan
              tidak dapat ditransfer kembali atau di-refund.
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Cari member penerima</p>
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setRecipient(null);
              }}
              placeholder="Nama, nomor telepon, atau email"
              disabled={isSubmitting}
            />
            {recipient ? (
              <div className="border-primary bg-primary/5 mt-2 rounded-md border p-3 text-sm">
                <p className="font-medium">{recipient.name}</p>
                <p className="text-muted-foreground">{formatPhone(recipient.phone)}</p>
              </div>
            ) : debouncedSearch.length >= 2 ? (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                {isFetching && <p className="text-muted-foreground p-2 text-sm">Mencari member…</p>}
                {!isFetching && availableRecipients.length === 0 && (
                  <p className="text-muted-foreground p-2 text-sm">Member tidak ditemukan.</p>
                )}
                {availableRecipients.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="hover:bg-muted w-full rounded-sm p-2 text-left text-sm"
                    onClick={() => {
                      setRecipient(item);
                      setSearch(item.name);
                    }}
                  >
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{formatPhone(item.phone)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Jumlah jam</p>
            <Input
              type="number"
              min={1}
              max={membership.remainingSessions}
              step={1}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              placeholder={`Maksimal ${membership.remainingSessions} jam`}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Alasan transfer</p>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Alasan wajib untuk audit"
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          {recipient && Number.isInteger(numericHours) && numericHours > 0 && (
            <div className="border-warning/30 bg-warning/5 rounded-lg border p-3 text-sm">
              Transfer {numericHours} jam dari {membership.user?.name} kepada {recipient.name}.
              Saldo asal tersisa {Math.max(0, membership.remainingSessions - numericHours)} jam.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Konfirmasi Transfer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
}
