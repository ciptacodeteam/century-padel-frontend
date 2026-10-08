'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Download,
  Search,
  Users,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';
import { ROLE } from '@/lib/constants';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import type { CourtPerformance } from '@/types/court-performance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import ReportDatePicker from '@/components/admin/analytics/ReportDatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const number = (value: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);
const money = (value: number) => `Rp ${number(Math.round(value))}`;
function monthRange(month: string) {
  const [year, m] = month.split('-').map(Number);
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${new Date(Date.UTC(year, m, 0)).getUTCDate()}`
  };
}
function currentMonth(offset = 0) {
  const local = new Date(Date.now() + 7 * 3_600_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 7);
}
function dateLabel(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(date));
}
function bookedLabel(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(date));
}

export default function CourtPerformancePage() {
  const { hasAccess, isLoading: accessLoading } = useRoleAccess({
    allowedRoles: [ROLE.ADMIN],
    redirectTo: '/admin/analytics/business-insights'
  });
  const [month, setMonth] = useState(() => currentMonth());
  const [draft, setDraft] = useState(() => ({ ...monthRange(currentMonth()), courtId: '' }));
  const [filters, setFilters] = useState(draft);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [band, setBand] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [validation, setValidation] = useState('');
  const detailRef = useRef<HTMLElement>(null);
  const params = { ...filters, courtId: filters.courtId || undefined };
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'analytics', 'court-performance', filters],
    queryFn: async () =>
      (await adminApi.get<{ data: CourtPerformance }>('/analytics/court-performance', { params }))
        .data.data,
    enabled: hasAccess,
    staleTime: 60_000
  });
  function apply(next = draft) {
    const days = (Date.parse(next.endDate) - Date.parse(next.startDate)) / 86_400_000;
    if (!next.startDate || !next.endDate || !Number.isFinite(days) || days < 0 || days >= 366) {
      setValidation('Pilih tanggal awal–akhir yang valid, maksimal 366 hari.');
      return;
    }
    setValidation('');
    setFilters(next);
    setSelected(null);
    setSearch('');
    setBand('all');
    setPage(1);
  }
  function preset(offset: number) {
    const value = currentMonth(offset);
    const next = { ...draft, ...monthRange(value) };
    setMonth(value);
    setDraft(next);
    apply(next);
  }
  function openDetails(id: string | null) {
    setSelected(id);
    setSearch('');
    setBand('all');
    setPage(1);
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailRef.current?.focus({ preventScroll: true });
  }
  async function exportReport() {
    setExporting(true);
    try {
      const res = await adminApi.get('/analytics/court-performance/export', {
        params,
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `court-performance-${filters.startDate}-${filters.endDate}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('Export gagal. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  }
  const selectedRow = data?.rows.find((row) => row.id === selected);
  const details =
    data?.details.filter(
      (d) =>
        (!selected || d.groupId === selected) &&
        (band === 'all' || d.band === band) &&
        `${d.customer} ${d.invoiceNumber ?? ''} ${d.court}`
          .toLowerCase()
          .includes(search.toLowerCase())
    ) ?? [];
  const totalPages = Math.max(1, Math.ceil(details.length / 20));
  const currentPage = Math.min(page, totalPages);
  const filteredHours = details.reduce((sum, d) => sum + d.hours, 0);
  if (accessLoading || !hasAccess) return null;

  return (
    <main className="w-full min-w-0 space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.18em] uppercase">
            Analytics / Court Performance
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Pemakaian lapangan</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Lihat jam bermain, penggunaan membership, dan siapa yang melakukan booking.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportReport}
          disabled={!data || exporting || isFetching}
        >
          <Download className="size-4" />
          {exporting ? 'Menyiapkan…' : 'Export Excel'}
        </Button>
      </header>

      <Card className="shadow-none">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="text-muted-foreground mr-1 size-4" />
            <span className="mr-2 text-sm font-medium">Periode laporan</span>
            <Button size="sm" variant="secondary" onClick={() => preset(0)}>
              Bulan ini
            </Button>
            <Button size="sm" variant="ghost" onClick={() => preset(-1)}>
              Bulan lalu
            </Button>
            <span className="text-muted-foreground text-xs sm:ml-auto">
              Berdasarkan tanggal main · WIB
            </span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
            className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto]"
          >
            <div className="flex flex-col gap-2 text-xs font-medium">
              <span>Pilih bulan</span>
              <ReportDatePicker
                label="Pilih bulan"
                mode="month"
                value={month}
                onChange={(value) => {
                  setMonth(value);
                  setDraft({ ...draft, ...monthRange(value) });
                }}
              />
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <span>Dari tanggal</span>
              <ReportDatePicker
                label="Dari tanggal"
                value={draft.startDate}
                onChange={(value) => {
                  setMonth('');
                  setDraft({ ...draft, startDate: value });
                }}
              />
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <span>Sampai tanggal</span>
              <ReportDatePicker
                label="Sampai tanggal"
                value={draft.endDate}
                onChange={(value) => {
                  setMonth('');
                  setDraft({ ...draft, endDate: value });
                }}
              />
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <label htmlFor="report-court">Lapangan</label>
              <Select
                value={draft.courtId || 'all'}
                onValueChange={(value) =>
                  setDraft({ ...draft, courtId: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger
                  id="report-court"
                  className="w-full rounded-none px-3 font-normal data-[size=default]:h-10"
                >
                  <SelectValue placeholder="Semua lapangan" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  avoidCollisions={false}
                  className="max-h-64 rounded-none"
                >
                  <SelectItem value="all">Semua lapangan</SelectItem>
                  {data?.courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="h-10 self-end" disabled={isFetching}>
              Tampilkan
            </Button>
          </form>
          {validation && (
            <p role="alert" className="text-destructive text-sm">
              {validation}
            </p>
          )}
        </CardContent>
      </Card>

      {isPending ? (
        <div aria-label="Memuat laporan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p role="alert">Laporan belum berhasil dimuat.</p>
            <Button onClick={() => refetch()} variant="outline">
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : (
        data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">
                {dateLabel(filters.startDate)} — {dateLabel(filters.endDate)}{' '}
                <span className="text-muted-foreground font-normal">
                  / {data.courts.find((c) => c.id === filters.courtId)?.name ?? 'Semua lapangan'}
                </span>
              </p>
              <Badge variant="outline">Booking confirmed</Badge>
            </div>
            <section
              aria-label="Ringkasan pemakaian"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="bg-primary text-primary-foreground rounded-xl p-5">
                <div className="flex items-center justify-between text-sm opacity-90">
                  Total jam dipesan
                  <Clock3 className="size-4" />
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums">
                  {number(data.summary.hours)} <span className="text-sm font-normal">jam</span>
                </p>
                <p className="mt-3 text-xs opacity-80">
                  {number(data.summary.elapsedHours)} berlalu · {number(data.summary.upcomingHours)}{' '}
                  mendatang
                </p>
              </div>
              {[
                {
                  title: 'Non-membership',
                  value: `${number(data.summary.regularHours)} jam`,
                  note: 'Gabungan peak & non-peak',
                  icon: Clock3
                },
                {
                  title: 'Membership',
                  value: `${number(data.summary.membershipHours)} jam`,
                  note: 'Seluruh paket yang teridentifikasi',
                  icon: Users
                },
                {
                  title: 'Occupancy periode',
                  value:
                    data.summary.occupancy === null ? '—' : `${number(data.summary.occupancy)}%`,
                  note: `${number(data.summary.availableHours)} jam kapasitas slot tercatat`,
                  icon: CalendarDays
                }
              ].map((stat) => (
                <Card key={stat.title} className="shadow-none">
                  <CardContent className="p-5">
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      {stat.title}
                      <stat.icon className="size-4" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tabular-nums">{stat.value}</p>
                    <p className="text-muted-foreground mt-3 text-xs">{stat.note}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold">Rekap jam per kategori</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Pilih kategori atau paket untuk menelusuri detail booking.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openDetails(null)}>
                  Semua booking <ArrowDown className="size-4" />
                </Button>
              </div>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="pl-5">Kategori / paket membership</TableHead>
                    <TableHead>
                      <span title="Durasi jadwal yang sudah berlalu, bukan bukti check-in">
                        Jam berlalu
                      </span>
                    </TableHead>
                    <TableHead>Mendatang</TableHead>
                    <TableHead>Total jam</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>
                      <span className="sr-only">Detail</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={selected === row.id ? 'selected' : undefined}
                      className={row.hours === 0 ? 'text-muted-foreground' : ''}
                    >
                      <TableCell className="py-4 pl-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`size-2 shrink-0 rounded-full ${row.kind === 'membership' ? 'bg-violet-500' : row.kind === 'regular' ? 'bg-teal-500' : 'bg-amber-500'}`}
                          />
                          <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {row.packageHours !== null
                                ? `Paket ${number(row.packageHours)} jam · seluruh pemegang paket`
                                : row.kind === 'regular'
                                  ? 'Pembayaran non-membership'
                                  : 'Ditampilkan terpisah dari booking reguler'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{number(row.elapsedHours)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {number(row.upcomingHours)}
                      </TableCell>
                      <TableCell className="min-w-28">
                        <p className="font-semibold tabular-nums">{number(row.hours)} jam</p>
                        <div className="bg-muted mt-2 h-1 w-20 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${data.summary.hours ? (row.hours / data.summary.hours) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{row.bookings}</TableCell>
                      <TableCell className="pr-5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(row.id)}
                          aria-label={`Lihat detail ${row.name}`}
                        >
                          Detail <ArrowDown className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell className="py-4 pl-5">Total seluruh kategori</TableCell>
                    <TableCell>{number(data.summary.elapsedHours)}</TableCell>
                    <TableCell>{number(data.summary.upcomingHours)}</TableCell>
                    <TableCell>{number(data.summary.hours)} jam</TableCell>
                    <TableCell colSpan={2}>
                      {new Set(data.details.map((d) => d.bookingId)).size} booking unik
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            {data.rows.some((r) => r.kind === 'unverified') && (
              <p
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                Ada booking dengan paket / harga yang belum tercatat. Lihat kategori “Perlu
                verifikasi”; jamnya tetap masuk total, tetapi tidak diasumsikan sebagai paket
                tertentu.
              </p>
            )}

            <section
              ref={detailRef}
              tabIndex={-1}
              className="focus-visible:outline-ring scroll-mt-6 overflow-hidden rounded-xl border focus-visible:outline-2"
              aria-labelledby="booking-detail-heading"
            >
              <div className="space-y-4 border-b p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-primary mb-1 text-xs font-semibold uppercase">
                      Detail booking
                    </p>
                    <h2 id="booking-detail-heading" className="text-lg font-semibold">
                      {selectedRow?.name ?? 'Seluruh kategori'}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {number(filteredHours)} jam · {new Set(details.map((d) => d.bookingId)).size}{' '}
                      booking · {details.length} rincian waktu
                    </p>
                  </div>
                  {selected && (
                    <Button variant="ghost" size="sm" onClick={() => openDetails(null)}>
                      <X className="size-4" />
                      Reset kategori
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-3 left-3 size-4" />
                    <Input
                      aria-label="Cari customer, invoice, atau lapangan"
                      placeholder="Cari customer, invoice, atau lapangan…"
                      className="h-10 pl-9"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <Select
                    value={band}
                    onValueChange={(value) => {
                      setBand(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Filter peak dan non-peak"
                      className="w-full data-[size=default]:h-10 sm:w-48"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      avoidCollisions={false}
                    >
                      <SelectItem value="all">Peak & Non-Peak</SelectItem>
                      <SelectItem value="Peak">Peak saja</SelectItem>
                      <SelectItem value="Non-Peak">Non-Peak saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    {[
                      'Customer / invoice',
                      'Tanggal & jam main',
                      'Lapangan',
                      'Kategori / paket',
                      'Durasi',
                      'Harga normal',
                      'Booking dibuat'
                    ].map((label, i) => (
                      <TableHead key={label} className={i === 0 ? 'pl-5' : ''}>
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.slice((currentPage - 1) * 20, currentPage * 20).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="py-4 pl-5">
                        <p className="font-medium">{d.customer}</p>
                        {d.invoiceId ? (
                          <Link
                            href={`/admin/kelola-transaksi/${d.invoiceId}`}
                            className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            {d.invoiceNumber}
                            <ArrowUpRight className="size-3" />
                          </Link>
                        ) : (
                          <p className="text-muted-foreground mt-1 text-xs">Tanpa invoice</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p>{dateLabel(d.startAt)}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {d.startAt.slice(11, 16)}–{d.endAt.slice(11, 16)} WIB · {d.band}
                        </p>
                      </TableCell>
                      <TableCell>{d.court}</TableCell>
                      <TableCell>
                        <span className="block max-w-56 whitespace-normal">{d.category}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{number(d.hours)} jam</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {d.upcomingHours === 0
                            ? 'Berlalu'
                            : d.elapsedHours === 0
                              ? 'Mendatang'
                              : 'Berlangsung'}
                        </p>
                      </TableCell>
                      <TableCell className="tabular-nums">{money(d.normalValue)}</TableCell>
                      <TableCell className="text-muted-foreground pr-5 text-xs">
                        {bookedLabel(d.bookedAt)} WIB
                      </TableCell>
                    </TableRow>
                  ))}
                  {details.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center">
                        <p className="font-medium">Belum ada booking yang sesuai</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Coba periode lain atau ubah pencarian dan filter.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                <p className="text-muted-foreground text-xs">
                  Halaman {currentPage} dari {totalPages} · 20 rincian per halaman
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </section>
            <aside className="text-muted-foreground bg-muted/40 space-y-2 rounded-lg p-4 text-xs leading-relaxed">
              <p>
                <span className="text-foreground font-medium">Cara membaca laporan.</span> Jam
                dihitung dari durasi setiap lapangan, bukan debit saldo membership. “Berlalu”
                mengikuti waktu jadwal, bukan bukti kehadiran. Booking cancelled dan hold tidak
                masuk pemakaian.
              </p>
              <p>
                Peak: Senin–Jumat mulai 16.00. Weekend non-peak. Harga normal adalah nilai slot
                sebelum diskon / membership, bukan pendapatan. Rincian dipecah per jam agar peak dan
                non-peak dapat diperiksa.
              </p>
              <p>
                Occupancy memakai kapasitas slot yang tercatat tersedia atau dipesan; slot diblokir
                dikeluarkan. Perubahan jadwal dapat memengaruhi kapasitas historis. Export Excel
                berisi seluruh rekap dan detail untuk periode serta lapangan terpilih.
              </p>
            </aside>
          </>
        )
      )}
    </main>
  );
}
