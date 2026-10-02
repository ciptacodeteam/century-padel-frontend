'use client';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MEMBERSHIP_TYPE_LABEL } from '@/lib/membership-eligibility';
import { myMembershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  History,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function MyMembershipPage() {
  const { data, isPending, isError, refetch } = useQuery(myMembershipsQueryOptions);
  const activeMemberships = data?.active ?? [];
  const hasMembershipHistory = (data?.expired?.length ?? 0) > 0;

  return (
    <>
      <MainHeader title="Membership Saya" withLogo={false} withBorder />

      <main className="mt-24 min-h-[calc(100dvh-6rem)] pb-32 lg:relative lg:left-1/2 lg:mt-0 lg:w-screen lg:-translate-x-1/2 lg:bg-neutral-50 lg:pt-28 lg:pb-16">
        <div className="mx-auto w-11/12 max-w-5xl space-y-5">
          <section className="hidden border bg-white p-6 lg:block">
            <p className="text-primary text-sm font-semibold">Century Padel Membership</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">Membership Saya</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Pantau sisa jam bermain, masa aktif, dan semua benefit membership kamu.
            </p>
          </section>

          {isPending && <MembershipLoadingState />}

          {!isPending && isError && (
            <Card className="border-neutral-200 bg-white">
              <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
                  <Crown className="size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Membership gagal dimuat</h2>
                  <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    Terjadi kendala saat mengambil data membership kamu. Silakan coba kembali.
                  </p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          )}

          {!isPending && !isError && activeMemberships.length === 0 && (
            <MembershipEmptyState hasMembershipHistory={hasMembershipHistory} />
          )}

          {!isPending && !isError && activeMemberships.length > 0 && (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Paket yang dapat digunakan</p>
                  <h2 className="text-xl font-bold">{activeMemberships.length} Membership Aktif</h2>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/membership">Lihat Paket</Link>
                </Button>
              </div>

              <section className="grid gap-5 lg:grid-cols-2">
                {activeMemberships.map((userMembership) => {
                  const membership = userMembership.membership;
                  const allocatedHours =
                    userMembership.incomingTransfer?.transferredHours ?? membership.sessions;
                  const remainingPercentage = Math.min(
                    100,
                    Math.max(
                      0,
                      (userMembership.remainingSessions / Math.max(1, allocatedHours)) * 100
                    )
                  );
                  const usedHours = Math.max(0, allocatedHours - userMembership.remainingSessions);

                  return (
                    <Card
                      key={userMembership.id}
                      className="overflow-hidden border-neutral-200 bg-white py-0 shadow-sm"
                    >
                      <CardHeader className="from-primary to-primary/80 gap-4 bg-gradient-to-br p-5 text-white sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                              <Crown className="size-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white/75">Membership aktif</p>
                              <h2 className="truncate text-xl font-bold">{membership.name}</h2>
                            </div>
                          </div>
                          <Badge className="border-white/30 bg-white/15 text-white hover:bg-white/15">
                            Aktif
                          </Badge>
                        </div>

                        <div>
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs text-white/75">Sisa jam bermain</p>
                              <p className="mt-1 text-3xl font-bold">
                                {userMembership.remainingSessions}
                                <span className="ml-1 text-base font-medium text-white/80">
                                  jam
                                </span>
                              </p>
                            </div>
                            <p className="text-right text-xs text-white/75">
                              {usedHours} dari {allocatedHours} jam terpakai
                            </p>
                          </div>
                          <Progress
                            value={remainingPercentage}
                            className="mt-3 h-2 bg-white/25"
                            indicatorClassName="bg-white"
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5 p-5 sm:p-6">
                        {userMembership.acquisitionType === 'TRANSFER' && (
                          <div className="flex items-start gap-3 rounded-lg bg-sky-50 p-3 text-sky-800">
                            <Sparkles className="mt-0.5 size-4 shrink-0" />
                            <p className="text-xs leading-5">
                              Saldo transfer
                              {userMembership.incomingTransfer
                                ? ` dari ${userMembership.incomingTransfer.fromUser.name}`
                                : ''}
                              .
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/70 rounded-lg p-3">
                            <Clock3 className="text-primary mb-2 size-5" />
                            <p className="text-muted-foreground text-xs">Masa aktif</p>
                            <p className="mt-0.5 font-semibold">
                              {userMembership.remainingDuration} hari lagi
                            </p>
                          </div>
                          <div className="bg-muted/70 rounded-lg p-3">
                            <CalendarDays className="text-primary mb-2 size-5" />
                            <p className="text-muted-foreground text-xs">Berlaku hingga</p>
                            <p className="mt-0.5 font-semibold">
                              {dayjs(userMembership.endDate).format('DD MMM YYYY')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-y py-3 text-sm">
                          <span className="text-muted-foreground">Tipe penggunaan</span>
                          <span className="font-semibold">
                            {MEMBERSHIP_TYPE_LABEL[membership.type ?? 'ALL_HOUR']}
                          </span>
                        </div>

                        {membership.description && (
                          <p className="text-muted-foreground text-sm leading-6">
                            {membership.description}
                          </p>
                        )}

                        {membership.benefits && membership.benefits.length > 0 && (
                          <div>
                            <p className="mb-3 text-sm font-semibold">Benefit membership</p>
                            <ul className="space-y-2.5">
                              {membership.benefits.map((benefit) => (
                                <li key={benefit.id} className="flex items-start gap-2.5 text-sm">
                                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                                  <span className="text-muted-foreground">{benefit.benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button className="w-full" size="lg" asChild>
                          <Link href="/booking">
                            Booking Lapangan
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>

      <MainBottomNavigation />
    </>
  );
}

function MembershipEmptyState({ hasMembershipHistory }: { hasMembershipHistory: boolean }) {
  return (
    <Card className="overflow-hidden border-neutral-200 bg-white shadow-sm">
      <CardContent className="relative flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <div className="bg-primary/5 absolute -top-20 -right-20 size-56 rounded-full" />
        <div className="bg-primary/5 absolute -bottom-24 -left-16 size-56 rounded-full" />

        <div className="relative flex max-w-md flex-col items-center">
          <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
            {hasMembershipHistory ? <History className="size-9" /> : <Crown className="size-9" />}
          </div>
          <h2 className="mt-6 text-2xl font-bold">
            {hasMembershipHistory ? 'Membership kamu sudah berakhir' : 'Belum ada membership aktif'}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            {hasMembershipHistory
              ? 'Aktifkan paket baru untuk kembali menikmati jam bermain dan benefit khusus member.'
              : 'Pilih paket yang sesuai dengan rutinitas bermainmu dan nikmati harga serta benefit khusus member.'}
          </p>
          <Button className="mt-7 w-full sm:w-auto" size="lg" asChild>
            <Link href="/membership">
              Lihat Paket Membership
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MembershipLoadingState() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {[0, 1].map((item) => (
        <Card key={item} className="overflow-hidden border-neutral-200 bg-white py-0">
          <div className="bg-primary/10 space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-44" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
          <CardContent className="grid grid-cols-2 gap-3 p-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
