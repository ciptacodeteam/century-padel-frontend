'use client';

import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  History,
  RotateCcw,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import MembershipPackagePicker from './MembershipPackagePicker';
import { cn } from '@/lib/utils';
import { formatSlotTime, toLocalSlotDate } from '@/lib/time-utils';
import { groupMembershipBookings, type MembershipActivityRow } from '@/lib/membership-activity';
import type { MembershipActivity } from '@/types/membership-activity';

const date = (value: string, time = false) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? ({ hour: '2-digit', minute: '2-digit' } as const) : {})
  }).format(new Date(value));
const slotDate = (value: string) => {
  const localDate = toLocalSlotDate(value);
  return localDate
    ? new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(localDate)
    : '-';
};
const hours = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const statusLabels = {
  COMPLETED: 'Selesai',
  HOLD: 'Menunggu pembayaran',
  CANCELLED: 'Dibatalkan',
  PARTIAL: 'Sebagian dibatalkan'
};
const packageStatus = {
  ACTIVE: 'Aktif',
  EXPIRED: 'Berakhir / habis',
  SUSPENDED: 'Ditangguhkan',
  CANCELLED: 'Dibatalkan',
  UPCOMING: 'Belum mulai'
};
const filters = [
  { id: 'ALL', label: 'Semua' },
  { id: 'BOOKING', label: 'Pemakaian' },
  { id: 'TRANSFER', label: 'Transfer' }
];

export default function MembershipActivitySection({ activity }: { activity: MembershipActivity }) {
  const [filter, setFilter] = useState('ALL');
  const [packageId, setPackageId] = useState('ALL');
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<MembershipActivityRow | null>(null);
  const packages = new Map(activity.memberships.map((membership) => [membership.id, membership]));
  const selectedMembershipIds = [
    ...new Set(selected?.items.map((item) => item.membershipUserId) ?? [])
  ];
  const selectedPackage =
    selectedMembershipIds.length === 1 ? packages.get(selectedMembershipIds[0]) : undefined;
  const filteredPackage = packages.get(packageId);
  const events = groupMembershipBookings(
    activity.events.filter(
      (event) =>
        (packageId === 'ALL' || event.membershipUserId === packageId) &&
        (filter === 'ALL' ||
          (filter === 'TRANSFER'
            ? event.type.startsWith('TRANSFER') || (event.type === 'RETURN' && !!event.counterpart)
            : event.type === 'BOOKING' || (event.type === 'RETURN' && !!event.court)))
    )
  );
  const hasUntracked = activity.memberships.some((membership) => membership.untrackedHours > 0);

  return (
    <section
      aria-labelledby="membership-history-title"
      className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
    >
      <div className="space-y-5 border-b p-5 sm:p-6">
        <div>
          <div className="text-primary mb-2 flex items-center gap-2">
            <History className="size-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Aktivitas membership
            </span>
          </div>
          <h2 id="membership-history-title" className="text-xl font-bold">
            Riwayat Jam
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Telusuri pemakaian dan perpindahan jam, termasuk dari paket yang sudah berakhir.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            className="flex min-w-0 gap-1 rounded-lg bg-neutral-100 p-1 md:shrink-0"
            role="group"
            aria-label="Jenis aktivitas"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => {
                  setFilter(item.id);
                  setLimit(10);
                }}
                className={cn(
                  'focus-visible:outline-primary flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-3',
                  filter === item.id
                    ? 'text-primary bg-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <MembershipPackagePicker
            memberships={activity.memberships}
            value={packageId}
            onValueChange={(value) => {
              setPackageId(value);
              setLimit(10);
            }}
          />
        </div>
      </div>

      {filteredPackage && (
        <div className="border-b bg-neutral-50/50 px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold [overflow-wrap:anywhere]">
            {filteredPackage.name}{' '}
            <span className="text-muted-foreground text-xs font-normal">
              · {packageStatus[filteredPackage.status]}
            </span>
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ['Kuota awal', filteredPackage.allocatedHours],
                ['Sisa saat ini', filteredPackage.remainingHours],
                ['Pemakaian booking', filteredPackage.bookingHours],
                ['Transfer keluar', filteredPackage.transferredOutHours]
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="mt-1 text-sm font-semibold">{hours(value)} jam</dd>
              </div>
            ))}
          </dl>
          {(filteredPackage.heldHours > 0 || filteredPackage.untrackedHours > 0) && (
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              Menunggu pembayaran: {hours(filteredPackage.heldHours)} jam · Perubahan lain:{' '}
              {hours(filteredPackage.untrackedHours)} jam
            </p>
          )}
        </div>
      )}
      {events.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center" role="status">
          <History className="text-muted-foreground/50 mb-3 size-8" />
          <p className="font-semibold">
            Belum ada aktivitas
            {filter === 'TRANSFER' ? ' transfer' : filter === 'BOOKING' ? ' pemakaian' : ''}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Riwayat yang sesuai dengan pilihanmu akan tampil di sini.
          </p>
        </div>
      ) : (
        <>
          <div className="text-muted-foreground flex items-center justify-between border-b bg-neutral-50/70 px-5 py-3 text-xs sm:px-6">
            <span aria-live="polite">{events.length} aktivitas</span>
            <span>Terbaru dahulu · WIB</span>
          </div>
          <ul className="divide-y">
            {events.slice(0, limit).map((event) => {
              const Icon =
                event.type === 'BOOKING'
                  ? CalendarDays
                  : event.type === 'RETURN'
                    ? RotateCcw
                    : event.type === 'PURCHASE'
                      ? Wallet
                      : event.hours > 0
                        ? ArrowDownLeft
                        : ArrowUpRight;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(event)}
                    className="focus-visible:outline-primary flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:items-center sm:gap-4 sm:px-6"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
                        event.hours > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold break-words">{event.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5 break-words">
                        {new Set(event.items.map((item) => item.membershipUserId)).size > 1
                          ? `${new Set(event.items.map((item) => item.membershipUserId)).size} paket membership`
                          : `${packages.get(event.membershipUserId)?.name} · #${event.membershipUserId.slice(-6)}`}
                      </p>
                      {event.type === 'BOOKING' && (
                        <p className="text-muted-foreground text-xs leading-5 [overflow-wrap:anywhere]">
                          {event.reference}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs leading-5">
                        {date(event.occurredAt, true)}
                      </p>
                      {event.status !== 'COMPLETED' && (
                        <span
                          className={cn(
                            'mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium',
                            event.status === 'HOLD'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-neutral-100 text-neutral-600'
                          )}
                        >
                          {statusLabels[event.status]}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
                      <span
                        className={cn(
                          'text-sm font-bold whitespace-nowrap tabular-nums',
                          event.hours > 0 ? 'text-emerald-700' : 'text-foreground'
                        )}
                      >
                        {event.hours > 0 ? '+' : '−'}
                        {hours(Math.abs(event.hours))}{' '}
                        <span className="text-xs font-normal">jam</span>
                      </span>
                      <ChevronRight className="text-muted-foreground hidden size-4 sm:block" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {events.length > limit && (
            <div className="border-t p-4 text-center">
              <Button variant="outline" onClick={() => setLimit((value) => value + 10)}>
                Tampilkan lebih banyak
              </Button>
            </div>
          )}
        </>
      )}
      <div className="text-muted-foreground space-y-1 border-t bg-neutral-50/70 px-5 py-4 text-xs leading-5 sm:px-6">
        <p>
          Jadwal booking mengikuti data terkini. Jam yang menunggu pembayaran masih mengurangi saldo
          tersedia.
        </p>
        {hasUntracked && (
          <p>
            Sebagian perubahan saldo lama belum memiliki detail paket asal. Selisih ini ditampilkan
            sebagai “Perubahan lain” pada ringkasan paket.
          </p>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas Jam</DialogTitle>
            <DialogDescription>{selected?.title}</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="rounded-lg bg-neutral-50 p-5">
                <p className="text-muted-foreground text-xs">Perubahan jam</p>
                <p
                  className={cn(
                    'mt-1 text-3xl font-bold tabular-nums',
                    selected.hours > 0 && 'text-emerald-700'
                  )}
                >
                  {selected.hours > 0 ? '+' : '−'}
                  {hours(Math.abs(selected.hours))}{' '}
                  <span className="text-base font-medium">jam</span>
                </p>
              </div>
              <dl className="divide-y text-sm">
                {(
                  [
                    [
                      'Membership',
                      selectedPackage?.name ??
                        (selectedMembershipIds.length > 1
                          ? `${selectedMembershipIds.length} paket membership`
                          : undefined)
                    ],
                    ['ID paket', selectedPackage ? selected.membershipUserId : undefined],
                    ['Waktu aktivitas', `${date(selected.occurredAt, true)} WIB`],
                    ['Status', statusLabels[selected.status]],
                    [
                      'Sisa paket saat ini',
                      selectedPackage ? `${hours(selectedPackage.remainingHours)} jam` : undefined
                    ],
                    [
                      selected.type === 'TRANSFER_IN'
                        ? 'Pengirim'
                        : selected.type === 'TRANSFER_OUT'
                          ? 'Penerima'
                          : 'Member terkait',
                      selected.counterpart
                    ],
                    ['Lapangan', selected.items.length === 1 ? selected.court : undefined],
                    [
                      'Jadwal terkini',
                      selected.items.length === 1 && selected.startAt && selected.endAt
                        ? `${slotDate(selected.startAt)} · ${formatSlotTime(selected.startAt)}–${formatSlotTime(selected.endAt)} WIB`
                        : undefined
                    ],
                    ['Berlaku hingga', selectedPackage ? date(selectedPackage.endDate) : undefined],
                    ['Nomor referensi', selected.reference]
                  ] as Array<[string, string | undefined]>
                )
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[1fr_1.5fr] gap-4 py-3">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium [overflow-wrap:anywhere] break-words">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
              {selected.type === 'BOOKING' && selected.items.length > 1 && (
                <section aria-label="Rincian booking" className="min-w-0 border-t pt-4">
                  <h3 className="text-sm font-semibold">
                    Rincian booking · {selected.items.length} slot
                  </h3>
                  <ul className="mt-2 divide-y">
                    {[...selected.items]
                      .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''))
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex min-w-0 items-start justify-between gap-3 py-3 text-sm"
                        >
                          <div className="min-w-0 flex-1 space-y-1 [overflow-wrap:anywhere]">
                            <p className="font-medium">{item.court ?? 'Lapangan'}</p>
                            {item.startAt && item.endAt && (
                              <p className="text-muted-foreground text-xs">
                                {slotDate(item.startAt)} · {formatSlotTime(item.startAt)}–
                                {formatSlotTime(item.endAt)} WIB
                              </p>
                            )}
                            <p className="text-muted-foreground text-xs">
                              {packages.get(item.membershipUserId)?.name} · #
                              {item.membershipUserId.slice(-6)}
                            </p>
                            {item.status !== 'COMPLETED' && (
                              <p className="text-muted-foreground text-xs">
                                {statusLabels[item.status]}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 font-semibold tabular-nums">
                            −{hours(Math.abs(item.hours))} jam
                          </span>
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              {selected.status === 'CANCELLED' && (
                <p className="text-muted-foreground rounded-lg bg-neutral-50 p-3 text-xs leading-5">
                  Aktivitas ini dibatalkan. Pengembalian jam yang tercatat ditampilkan sebagai
                  aktivitas terpisah.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
