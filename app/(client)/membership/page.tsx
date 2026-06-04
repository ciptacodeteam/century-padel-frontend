'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { membershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CheckCircle2, Clock, PackageCheck } from 'lucide-react';

export default function MembershipPage() {
  const { data, isLoading, isError } = useQuery(membershipsQueryOptions());
  const memberships = (data ?? []).filter((membership) => membership.isActive);
  const totalSessions = memberships.reduce((total, membership) => total + membership.sessions, 0);
  const longestDuration = memberships.reduce(
    (duration, membership) => Math.max(duration, membership.duration),
    0
  );

  return (
    <>
      <MainHeader backHref="/" title="Value Pack" withLogo={false} withBorder />

      <main className="mx-auto flex w-11/12 max-w-7xl flex-col gap-4 pb-12 lg:relative lg:left-1/2 lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50">
        <section className="mx-auto hidden w-11/12 max-w-7xl items-end justify-between gap-8 pt-32 pb-8 lg:flex">
          <div className="max-w-2xl">
            <p className="text-primary text-sm font-semibold">Century Padel Value Pack</p>
            <h1 className="mt-2 text-4xl font-bold tracking-normal text-neutral-950">
              Pilih paket bermain yang paling pas
            </h1>
            <p className="text-muted-foreground mt-3 text-base leading-7">
              Hemat lebih banyak dengan paket jam bermain yang fleksibel untuk latihan rutin,
              sparring, atau agenda club.
            </p>
          </div>
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="mx-auto flex min-h-[40vh] w-full max-w-7xl flex-col items-center justify-center gap-2 text-center lg:border lg:bg-white">
            <p className="text-muted-foreground text-sm">Memuat membership...</p>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="mx-auto flex min-h-[40vh] w-full max-w-7xl flex-col items-center justify-center gap-2 text-center lg:border lg:bg-white">
            <p className="text-destructive text-sm">Gagal memuat membership. Silakan coba lagi.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && memberships.length === 0 && (
          <div className="mx-auto flex min-h-[40vh] w-full max-w-7xl flex-col items-center justify-center gap-3 text-center lg:border lg:bg-white">
            <p className="text-lg font-semibold">Belum ada Paket Membership</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Kami sedang menyiapkan paket terbaik untuk kamu. Silahkan tunggu beberapa saat.
            </p>
          </div>
        )}

        {/* Membership list */}
        {!isLoading && !isError && memberships.length > 0 && (
          <section className="grid gap-6 pt-24 pb-12 lg:mx-auto lg:w-11/12 lg:max-w-7xl lg:grid-cols-3 lg:items-stretch lg:pt-0">
            {memberships.map((pack) => (
              <Card key={pack.id} className="flex flex-col lg:border-neutral-200 lg:bg-white">
                <CardHeader className="lg:p-6">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-bold tracking-tight uppercase lg:text-2xl">
                      {pack.name}
                    </CardTitle>
                    {pack.isActive && (
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-primary text-2xl font-bold lg:text-3xl">
                      Rp {pack.price.toLocaleString('id-ID')}
                    </div>

                    {/* Key Information */}
                    <div className="flex flex-wrap gap-3 pt-2 lg:grid lg:grid-cols-2">
                      <div className="flex items-center gap-1.5 text-sm lg:border lg:p-3">
                        <PackageCheck className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="text-foreground font-medium">{pack.sessions}</span>
                        <span className="text-muted-foreground">Jam</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm lg:border lg:p-3">
                        <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="text-foreground font-medium">{pack.duration}</span>
                        <span className="text-muted-foreground">Hari</span>
                      </div>
                    </div>
                  </div>

                  {pack.description && (
                    <CardDescription className="line-clamp-2 pt-2">
                      {pack.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 lg:px-6">
                  {pack.benefits && pack.benefits.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Benefit:</h4>
                      <ul className="space-y-2">
                        {pack.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                            <span className="text-muted-foreground">{benefit.benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4 lg:px-6 lg:pb-6">
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/membership/${pack.id}`}>Pesan Sekarang</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
