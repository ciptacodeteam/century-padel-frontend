'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tournamentDetailQueryOptions } from '@/queries/tournament';
import { formatNumber, getPlaceholderImageUrl, resolveMediaUrl } from '@/lib/utils';
import { IconCalendar, IconClock, IconMapPin, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useParams } from 'next/navigation';

const TournamentDetailPage = () => {
  const params = useParams();
  const tournamentId = params.id as string;

  const { data, isLoading, isError } = useQuery(tournamentDetailQueryOptions(tournamentId));
  const imageUrl = resolveMediaUrl(data?.image);

  const status = data
    ? dayjs(data.endDate).isBefore(dayjs())
      ? 'Selesai'
      : dayjs(data.startDate).isAfter(dayjs())
        ? 'Segera dimulai'
        : 'Sedang berlangsung'
    : '';

  return (
    <>
      <MainHeader backHref="/tournaments" title="Detail Turnamen" withLogo={false} withBorder />
      <main className="mx-auto mt-24 flex w-11/12 max-w-7xl flex-col pb-16 lg:relative lg:left-1/2 lg:mt-0 lg:min-h-screen lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50 lg:px-0 lg:pt-24 lg:pb-24">
        {isLoading && (
          <div className="text-muted-foreground mx-auto w-11/12 py-20 text-center text-sm lg:max-w-7xl lg:border lg:bg-white">
            Memuat detail turnamen...
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-destructive mx-auto w-11/12 py-20 text-center text-sm lg:max-w-7xl lg:border lg:bg-white">
            Gagal memuat detail turnamen. Silakan coba lagi.
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="lg:pt-8 lg:mx-auto lg:grid lg:w-11/12 lg:max-w-7xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-4">
            <section className="lg:space-y-5">
              {imageUrl && (
                <div className="relative h-60 w-full lg:h-105 lg:border lg:bg-white">
                  <Image
                    src={imageUrl || getPlaceholderImageUrl(data.name)}
                    alt={data.name}
                    fill
                    className="object-cover lg:rounded-none"
                    sizes="100vw"
                    priority
                    unoptimized
                  />
                  <div className="absolute top-4 left-4 hidden lg:block">
                    <Badge className="bg-black/70 text-white">{status}</Badge>
                  </div>
                </div>
              )}

              <div className="mx-auto w-11/12 flex-1 space-y-4 py-6 lg:mx-0 lg:w-full lg:py-0">
                <div className="space-y-3 lg:border lg:bg-white lg:p-8">
                  <div className="flex items-center gap-2 lg:hidden">
                    <Badge>{status}</Badge>
                  </div>
                  <p className="text-primary hidden text-sm font-semibold lg:block">
                    Detail Turnamen
                  </p>
                  <h1 className="text-2xl leading-tight font-bold lg:text-4xl">{data.name}</h1>
                  {data.description && (
                    <p className="text-muted-foreground text-sm leading-6 lg:text-base lg:leading-7">
                      {data.description}
                    </p>
                  )}
                </div>

                <Card className="lg:hidden">
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IconCalendar className="text-primary size-5" />
                      <span>
                        {dayjs(data.startDate).format('DD MMM YYYY')} -{' '}
                        {dayjs(data.endDate).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IconClock className="text-primary size-5" />
                      <span>
                        {data.startTime} - {data.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IconMapPin className="text-primary size-5" />
                      <span>{data.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IconUsers className="text-primary size-5" />
                      <span>
                        Maks {data.maxTeams} tim • {data.teamSize} pemain / tim
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {data.rules && (
                  <Card className="lg:border-neutral-200 lg:bg-white">
                    <CardContent className="space-y-2 px-4 lg:p-8">
                      <h2 className="text-lg font-semibold lg:text-xl">Peraturan Turnamen</h2>
                      <p
                        className="text-muted-foreground text-sm leading-6 whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: data.rulesHtml }}
                      />
                    </CardContent>
                  </Card>
                )}

                <Card className="lg:hidden">
                  <CardContent className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase">Biaya Pendaftaran</p>
                    <p className="text-2xl font-bold">Rp {formatNumber(data.entryFee)}</p>
                    <Button className="mt-2 w-full lg:w-fit">Daftar Sekarang</Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            <aside className="hidden space-y-5 lg:block">
              <Card className="border-neutral-200 bg-white lg:sticky lg:top-28 lg:py-0">
                <CardContent className="space-y-6 p-6">
                  <div>
                    <Badge>{status}</Badge>
                    <p className="mt-4 text-sm text-muted-foreground">Biaya Pendaftaran</p>
                    <p className="mt-1 text-3xl font-bold">Rp {formatNumber(data.entryFee)}</p>
                  </div>

                  <Button className="w-full">Daftar Sekarang</Button>

                  <div className="space-y-4 border-t pt-5">
                    <div className="flex items-start gap-3">
                      <IconCalendar className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Tanggal</p>
                        <p className="text-muted-foreground text-sm">
                          {dayjs(data.startDate).format('DD MMM YYYY')} -{' '}
                          {dayjs(data.endDate).format('DD MMM YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconClock className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Waktu</p>
                        <p className="text-muted-foreground text-sm">
                          {data.startTime} - {data.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconMapPin className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Lokasi</p>
                        <p className="text-muted-foreground text-sm">{data.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconUsers className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Format Tim</p>
                        <p className="text-muted-foreground text-sm">
                          Maks {data.maxTeams} tim • {data.teamSize} pemain / tim
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </>
  );
};

export default TournamentDetailPage;
