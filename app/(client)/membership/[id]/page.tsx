'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_BADGE_VARIANT, STATUS_MAP } from '@/lib/constants';
import { membershipQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { IconCheck, IconTrophy } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, CreditCard, Info, PackageCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

export default function MembershipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const membershipId = resolvedParams.id;

  const { data: membership, isPending: isMembershipLoading } = useQuery(
    membershipQueryOptions(membershipId)
  );
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const openAuthModal = useAuthModalStore((state) => state.open);

  const isAuthenticated = !!user?.id;

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    // Store membership ID in sessionStorage for checkout page
    sessionStorage.setItem('membershipCheckoutId', membershipId);
    router.push('/membership/checkout');
  };

  if (isMembershipLoading) {
    return (
      <>
        <MainHeader title="Detail Membership" backHref="/valuepack" withLogo={false} withBorder />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl space-y-4 pb-12 lg:relative lg:left-1/2 lg:mt-0 lg:min-h-screen lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50 lg:pt-28">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    );
  }

  if (!membership) {
    return (
      <>
        <MainHeader title="Detail Membership" backHref="/membership" withLogo={false} withBorder />
        <main className="mx-auto mt-28 w-11/12 max-w-4xl pb-12 lg:relative lg:left-1/2 lg:mt-0 lg:min-h-screen lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50 lg:pt-28">
          <div className="text-muted-foreground py-10 text-center">Membership tidak ditemukan</div>
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader title="Detail Membership" backHref="/membership" withLogo={false} withBorder />
      <main className="mx-auto mt-24 w-11/12 max-w-4xl space-y-4 pb-28 lg:pb-16 sm:space-y-6 lg:relative lg:left-1/2 lg:mt-0 lg:min-h-screen lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50 lg:pt-28">
        <div className="lg:mx-auto lg:grid lg:w-11/12 lg:max-w-7xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-4">
          <section className="space-y-4 sm:space-y-6">
        {/* Membership Header Card */}
        <Card className="overflow-hidden py-0 lg:border-neutral-200 lg:bg-white">
          <div className="from-primary/10 via-primary/5 bg-linear-to-br to-transparent p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex-1">
                <CardTitle className="mb-2 text-xl font-bold tracking-tight uppercase sm:text-2xl lg:text-3xl">
                  {membership.name}
                </CardTitle>
                {membership.description && (
                  <p className="text-muted-foreground text-sm">{membership.description}</p>
                )}
              </div>
              {membership.isActive && (
                <Badge
                  variant={STATUS_BADGE_VARIANT[Number(membership.isActive)]}
                  className="w-fit"
                >
                  {STATUS_MAP[Number(membership.isActive)]}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:mt-6">
              <span className="text-primary text-2xl font-extrabold sm:text-2xl lg:text-3xl">
                {formatCurrency(membership.price)}
              </span>
              <span className="text-muted-foreground text-sm">
                untuk {membership.duration} hari
              </span>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
              {/* Sessions Info */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4 lg:rounded-none">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-base font-bold sm:text-xl">{membership.sessions}</p>
                  <p className="text-muted-foreground text-xs">Total Jam</p>
                </div>
              </div>

              {/* Duration Info */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4 lg:rounded-none">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-base font-bold sm:text-xl">{membership.duration}</p>
                  <p className="text-muted-foreground text-xs">Hari Aktif</p>
                </div>
              </div>

              {/* Price per Session */}
              <div className="bg-card flex items-center gap-3 rounded-lg border p-3 sm:p-4 lg:rounded-none">
                <div className="bg-primary/10 text-primary rounded-lg p-2 sm:p-2.5">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold sm:text-lg">
                    {formatCurrency(Math.round(membership.price / membership.sessions))}
                  </p>
                  <p className="text-muted-foreground text-xs">Per Jam</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        {membership.benefits && membership.benefits.length > 0 && (
          <Card className="lg:border-neutral-200 lg:bg-white">
            <CardHeader className="lg:p-8 lg:pb-0">
              <CardTitle className="flex items-center gap-2">
                <IconTrophy className="text-primary h-6 w-6" />
                <span>Benefit & Keuntungan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-2 lg:mt-4 lg:px-8">
              <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {membership.benefits.map((benefit) => (
                  <li
                    key={benefit.id}
                    className="bg-muted/30 flex items-start gap-2.5 rounded-lg border p-2.5 sm:gap-3 sm:p-3"
                  >
                    <div className="bg-primary/10 text-primary mt-0.5 rounded-full p-1 shadow-sm">
                      <IconCheck className="h-4 w-4 stroke-3" />
                    </div>
                    <span className="flex-1 text-sm leading-relaxed">{benefit.benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Content Card */}
        {membership.content && (
          <Card className="lg:border-neutral-200 lg:bg-white">
            <CardHeader className="lg:p-8 lg:pb-0">
              <CardTitle className="flex items-center gap-2">
                <Info className="text-primary h-6 w-6" />
                <span>Detail Membership</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-2 lg:p-8">
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: membership?.contentHtml ?? '' }}
              ></div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="border-primary/20 bg-primary/5 lg:bg-white">
          <CardContent className="p-4 py-2 sm:px-6">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <Info className="text-primary mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-medium">Informasi Penting:</p>
                <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
                  <li>
                    • Membership berlaku selama {membership.duration} hari sejak tanggal aktivasi
                  </li>
                  <li>• Total {membership.sessions} jam dapat digunakan dalam periode aktif</li>
                  <li>• Jam yang tidak terpakai akan hangus setelah masa aktif berakhir</li>
                  <li>• Membership tidak dapat dikembalikan atau dipindahtangankan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </section>

          <aside className="hidden lg:block">
            <Card className="sticky top-28 border-neutral-200 bg-white py-0">
              <CardContent className="space-y-6 p-6">
                <div>
                  {membership.isActive && (
                    <Badge
                      variant={STATUS_BADGE_VARIANT[Number(membership.isActive)]}
                      className="w-fit"
                    >
                      {STATUS_MAP[Number(membership.isActive)]}
                    </Badge>
                  )}
                  <p className="text-muted-foreground mt-5 text-sm">Total Pembayaran</p>
                  <p className="text-primary mt-1 text-3xl font-bold">
                    {formatCurrency(membership.price)}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    untuk {membership.sessions} jam selama {membership.duration} hari
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBuyNow}
                  disabled={!membership.isActive || isUserPending}
                >
                  {!membership.isActive ? 'Tidak Tersedia' : 'Beli Sekarang'}
                </Button>

                <div className="space-y-4 border-t pt-5">
                  <div className="flex items-start gap-3">
                    <PackageCheck className="text-primary mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Total Jam</p>
                      <p className="text-muted-foreground text-sm">{membership.sessions} jam</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="text-primary mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Masa Aktif</p>
                      <p className="text-muted-foreground text-sm">{membership.duration} hari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-primary mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Estimasi Per Jam</p>
                      <p className="text-muted-foreground text-sm">
                        {formatCurrency(Math.round(membership.price / membership.sessions))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Buy Button - Fixed at bottom */}
        <BottomNavigationWrapper className="lg:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-between sm:block">
              <p className="text-muted-foreground text-xs">Total Pembayaran</p>
              <p className="text-primary text-lg font-bold sm:text-xl">
                {formatCurrency(membership.price)}
              </p>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-[180px]"
              onClick={handleBuyNow}
              disabled={!membership.isActive || isUserPending}
            >
              {!membership.isActive ? 'Tidak Tersedia' : 'Beli Sekarang'}
            </Button>
          </div>
        </BottomNavigationWrapper>
      </main>
    </>
  );
}
