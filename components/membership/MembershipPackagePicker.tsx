'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { MembershipActivitySummary } from '@/types/membership-activity';

const statuses = {
  ACTIVE: 'Aktif',
  EXPIRED: 'Berakhir',
  SUSPENDED: 'Ditangguhkan',
  CANCELLED: 'Dibatalkan',
  UPCOMING: 'Belum mulai'
};
const date = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));

type Props = {
  memberships: MembershipActivitySummary[];
  value: string;
  onValueChange: (value: string) => void;
};

export default function MembershipPackagePicker({ memberships, value, onValueChange }: Props) {
  const mobile = useIsMobile();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = memberships.find((membership) => membership.id === value);
  const query = search.trim().toLocaleLowerCase('id-ID');
  const results = memberships
    .filter((membership) =>
      `${membership.name} ${date(membership.createdAt)} ${membership.id.slice(-6)} ${statuses[membership.status]}`
        .toLocaleLowerCase('id-ID')
        .includes(query)
    )
    .sort(
      (a, b) =>
        Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE') ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };
  const choose = (id: string) => {
    onValueChange(id);
    onOpenChange(false);
  };
  const trigger = (
    <Button
      variant="outline"
      className="h-11 w-full min-w-0 justify-between gap-3 overflow-hidden px-3 font-normal md:w-72 md:shrink-0"
      aria-label="Filter paket membership"
      title={selected?.name ?? 'Semua membership'}
    >
      <span className="min-w-0 flex-1 truncate text-left">
        {selected?.name ?? 'Semua membership'}
      </span>
      <ChevronDown className="text-muted-foreground size-4 shrink-0" />
    </Button>
  );
  const choices = (
    <>
      <div className="relative mx-4 my-3 shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          aria-label="Cari membership"
          placeholder="Cari nama, tanggal, atau ID paket"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 pl-9"
        />
      </div>
      <div
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 pb-3"
        role="group"
        aria-label="Pilihan membership"
      >
        <button
          type="button"
          aria-pressed={value === 'ALL'}
          onClick={() => choose('ALL')}
          className="focus-visible:outline-primary flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2"
        >
          <span className="min-w-0 flex-1">Semua membership</span>
          {value === 'ALL' && <Check className="text-primary size-4 shrink-0" />}
        </button>
        {results.map((membership) => (
          <button
            key={membership.id}
            type="button"
            aria-pressed={value === membership.id}
            onClick={() => choose(membership.id)}
            className={cn(
              'focus-visible:outline-primary flex w-full min-w-0 items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-neutral-50 focus-visible:outline-2',
              value === membership.id && 'bg-primary/5'
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-5 font-semibold [overflow-wrap:anywhere]">
                {membership.name}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="text-muted-foreground text-xs leading-5">
                  {date(membership.createdAt)} · #{membership.id.slice(-6)}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium',
                    membership.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : membership.status === 'SUSPENDED'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {statuses[membership.status]}
                </span>
              </span>
            </span>
            <span className="mt-0.5 w-4 shrink-0">
              {value === membership.id && <Check className="text-primary size-4" />}
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <p role="status" className="text-muted-foreground px-3 py-8 text-center text-sm">
            {query
              ? 'Membership tidak ditemukan. Coba kata kunci lain.'
              : 'Belum ada paket membership.'}
          </p>
        )}
      </div>
    </>
  );

  if (mobile)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] min-w-0 gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          onOpenAutoFocus={(event) => {
            // Keep the keyboard closed until the customer chooses to search.
            event.preventDefault();
            titleRef.current?.focus();
          }}
        >
          <SheetHeader className="shrink-0 border-b px-5 pt-6 pr-12 pb-4 text-left">
            <SheetTitle ref={titleRef} tabIndex={-1} className="outline-none">
              Pilih Membership
            </SheetTitle>
            <SheetDescription>Pilih paket untuk melihat riwayat jamnya.</SheetDescription>
          </SheetHeader>
          {choices}
        </SheetContent>
      </Sheet>
    );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="flex max-h-[min(28rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] min-w-0 flex-col overflow-hidden p-0"
        aria-label="Pilih Membership"
      >
        <p className="shrink-0 border-b px-4 py-3 text-sm font-semibold">Pilih Membership</p>
        {choices}
      </PopoverContent>
    </Popover>
  );
}
