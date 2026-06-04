'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, resolveMediaUrl } from '@/lib/utils';
import { activeTournamentsQueryOptions, allTournamentsQueryOptions } from '@/queries/tournament';
import { IconCalendar, IconClock, IconMapPin, IconSearch, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const formatDateRange = (start: string | Date, end: string | Date) => {
  const startDay = dayjs(start).format('DD MMM YYYY');
  const endDay = dayjs(end).format('DD MMM YYYY');
  if (startDay === endDay) return startDay;
  return `${startDay} - ${endDay}`;
};

const TournamentCard = ({ tournament, onClick }: { tournament: any; onClick: () => void }) => {
  const imageUrl = resolveMediaUrl(tournament.image ?? undefined);

  return (
    <Card className="mt-3 overflow-hidden lg:mt-0 pt-0 lg:h-full lg:border-neutral-200 lg:bg-white lg:transition-shadow lg:hover:shadow-md">
      {imageUrl && (
        <div className="relative aspect-video w-full lg:aspect-16/10">
          <Image
            src={imageUrl}
            alt={tournament.name}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {dayjs(tournament.startDate).diff(dayjs(), 'day') >= 0 ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="space-y-4 lg:flex lg:h-full lg:flex-col">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold lg:text-xl">{tournament.name}</h3>
            {tournament.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{tournament.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex items-center gap-3">
            <IconCalendar className="text-primary size-5" />
            <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
          </div>
          <div className="flex items-center gap-3">
            <IconClock className="text-primary size-5" />
            <span>
              {tournament.startTime} - {tournament.endTime} WIB
            </span>
          </div>
          <div className="flex items-center gap-3">
            <IconMapPin className="text-primary size-5" />
            <span>{tournament.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <IconUsers className="text-primary size-5" />
            <span>
              Max {tournament.maxTeams} teams • {tournament.teamSize} players / team
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between lg:mt-auto lg:border-t lg:pt-5">
          <div>
            <p className="text-muted-foreground text-sm">Entry Fee</p>
            <p className="text-primary text-xl font-semibold">
              Rp{formatNumber(tournament.entryFee)}
            </p>
          </div>
          <Button onClick={onClick} variant="outline">
            Lihat Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TournamentsPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'all'>('active');

  const {
    data: activeTournaments,
    isLoading: isLoadingActive,
    isError: isActiveError
  } = useQuery(activeTournamentsQueryOptions());

  const {
    data: allTournaments,
    isLoading: isLoadingAll,
    isError: isAllError
  } = useQuery(allTournamentsQueryOptions());

  const filteredActive = useMemo(() => {
    if (!activeTournaments) return [];
    return activeTournaments.filter((tournament: any) =>
      tournament.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeTournaments, search]);

  const filteredAll = useMemo(() => {
    if (!allTournaments) return [];
    return allTournaments.filter((tournament: any) =>
      tournament.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [allTournaments, search]);

  const isLoading = tab === 'active' ? isLoadingActive : isLoadingAll;
  const isError = tab === 'active' ? isActiveError : isAllError;
  const dataset = tab === 'active' ? filteredActive : filteredAll;
  const activeCount = activeTournaments?.length ?? 0;
  const allCount = allTournaments?.length ?? 0;
  const completedCount =
    allTournaments?.filter((tournament: any) => dayjs(tournament.startDate).isBefore(dayjs(), 'day'))
      .length ?? 0;

  return (
    <>
      <MainHeader backHref="/" title="Turnamen" withLogo={false} withBorder />

      <main className="lg:mt-24 lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:bg-neutral-50 lg:pb-20">
        <div className="sticky z-10 w-full border-b bg-white md:top-14 lg:static">
          <div className="mx-auto hidden w-11/12 max-w-7xl items-end justify-between gap-8 py-8 lg:flex">
            <div className="max-w-2xl">
              <p className="text-primary text-sm font-semibold">Century Padel Tournament</p>
              <h1 className="mt-2 text-4xl font-bold tracking-normal text-neutral-950">
                Ikuti turnamen padel terbaru
              </h1>
              <p className="text-muted-foreground mt-3 text-base leading-7">
                Cari jadwal kompetisi, lihat lokasi, biaya pendaftaran, dan detail tim sebelum
                bergabung.
              </p>
            </div>

            <div className="grid min-w-90 grid-cols-3 border bg-white">
              <div className="border-r p-4">
                <p className="text-muted-foreground text-xs font-medium">Active</p>
                <p className="mt-1 text-2xl font-bold">{activeCount}</p>
              </div>
              <div className="border-r p-4">
                <p className="text-muted-foreground text-xs font-medium">All</p>
                <p className="mt-1 text-2xl font-bold">{allCount}</p>
              </div>
              <div className="p-4">
                <p className="text-muted-foreground text-xs font-medium">Completed</p>
                <p className="mt-1 text-2xl font-bold">{completedCount}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-11/12 pt-24 pb-3 md:pt-10 lg:max-w-7xl lg:pt-0">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari turnamen berdasarkan nama..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mx-auto w-11/12 pb-4 lg:max-w-7xl">
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'all')}>
              <TabsList className="grid w-full grid-cols-2 lg:max-w-xl">
                <TabsTrigger value="active">Sedang Berjalan</TabsTrigger>
                <TabsTrigger value="all">Semua Turnamen</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mx-auto w-11/12 flex-1 py-2 lg:max-w-7xl lg:py-10">
          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm lg:border lg:bg-white">
              Memuat turnamen...
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm lg:border lg:bg-white">
              Gagal memuat data turnamen. Silakan coba lagi.
            </div>
          )}

          {!isLoading && !isError && dataset.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm lg:border lg:bg-white">
              {search ? `Tidak ada turnamen dengan kata kunci.` : 'Belum ada turnamen tersedia.'}
            </div>
          )}

          {!isLoading && !isError && dataset.length > 0 && (
            <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
              {dataset.map((tournament: any) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onClick={() => router.push(`/tournaments/${tournament.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default TournamentsPage;
