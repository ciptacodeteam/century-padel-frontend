'use client';

import BookingCartBubble from '@/components/booking/BookingCartBubble';
import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { courtsSlotsQueryOptions } from '@/queries/court';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Court, Slot } from '@/types/model';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const timeSlots = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00'
];

type SelectedCell = {
  slotId: string;
  courtId: string;
  courtName: string;
  time: string;
  price: number;
  normalPrice?: number;
  discountPrice?: number;
  dateKey: string;
};

type BookingPageContentProps = {
  embedded?: boolean;
};

const getEndTime = (timeSlot: string) => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeSlot;

  return `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function BookingPageContent({ embedded = false }: BookingPageContentProps) {
  const router = useRouter();
  const {
    bookingItems,
    setBookingItems,
    setSelectedDate: setBookingDate,
    courtTotal,
    setCartOpen
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dateList, setDateList] = useState<
    { label: string; date: string; fullDate: string; active?: boolean }[]
  >([]);
  const [selectionsByDate, setSelectionsByDate] = useState<Record<string, SelectedCell[]>>({});
  const [selectedCourt, setSelectedCourt] = useState<null | {
    id: string;
    name: string;
    image?: string | null;
  }>(null);
  const didInitializeSelections = useRef(false);
  const didSkipInitialStoreSync = useRef(false);

  useEffect(() => {
    const today = dayjs();
    const endDate = today.add(3, 'month');
    const updatedDates: { label: string; date: string; fullDate: string; active?: boolean }[] = [];

    let current = today;
    while (current.isBefore(endDate)) {
      updatedDates.push({
        label: current.format('ddd'),
        date: current.format('DD MMM'),
        fullDate: current.format('YYYY-MM-DD'),
        active: current.isSame(today, 'day')
      });
      current = current.add(1, 'day');
    }

    setDateList(updatedDates);
  }, []);

  const activeDate = useMemo(
    () => dateList.find((item) => item.fullDate === selectedDate),
    [dateList, selectedDate]
  );
  const selectedFullDate = activeDate?.fullDate ?? selectedDate;

  const slotQueryParams = useMemo(
    () => ({
      startAt: dayjs(selectedFullDate).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      endAt: dayjs(selectedFullDate).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }),
    [selectedFullDate]
  );

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    courtsSlotsQueryOptions(slotQueryParams)
  );

  const slots = useMemo(() => slotsData ?? [], [slotsData]);

  const availableTimeSlots = useMemo(() => {
    const isToday = dayjs(selectedFullDate).isSame(dayjs(), 'day');
    if (!isToday) return timeSlots;

    const currentHour = dayjs().hour();
    return timeSlots.filter((time) => {
      const slotHour = parseInt(time.split(':')[0], 10);
      return slotHour > currentHour;
    });
  }, [selectedFullDate]);

  const courts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string | null }>();

    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId || map.has(courtId)) return;

      map.set(courtId, {
        id: courtId,
        name: slot.court?.name || `Court ${map.size + 1}`,
        image:
          (slot.court as Court | undefined)?.image ||
          getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' })
      });
    });

    if (map.size === 0) {
      return [
        {
          id: 'default-court',
          name: 'Court',
          image: getPlaceholderImageUrl({ width: 160, height: 90, text: 'No Image' })
        }
      ];
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot & { court?: Court }>();

    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId || !slot.startAt) return;

      const time = dayjs(slot.startAt).format('HH:mm');
      map.set(`${courtId}-${time}`, slot);
    });

    return map;
  }, [slots]);

  const selectedCells = useMemo(
    () => selectionsByDate[selectedDate] ?? [],
    [selectionsByDate, selectedDate]
  );

  const allSelections = useMemo(
    () =>
      Object.values(selectionsByDate)
        .flat()
        .sort((a, b) => {
          const dateSort = dayjs(a.dateKey).valueOf() - dayjs(b.dateKey).valueOf();
          if (dateSort !== 0) return dateSort;
          return a.time.localeCompare(b.time);
        }),
    [selectionsByDate]
  );

  useEffect(() => {
    if (didInitializeSelections.current) return;

    const persistedSelections = bookingItems.reduce<Record<string, SelectedCell[]>>((acc, item) => {
      const dateKey = item.date;
      if (!dateKey) return acc;

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push({
        slotId: item.slotId,
        courtId: item.courtId,
        courtName: item.courtName,
        time: item.timeSlot,
        price: item.price,
        normalPrice: item.normalPrice,
        discountPrice: item.discountPrice,
        dateKey
      });

      return acc;
    }, {});

    if (bookingItems[0]?.date) {
      setSelectedDate(bookingItems[0].date);
    }

    setSelectionsByDate(persistedSelections);
    didInitializeSelections.current = true;
  }, [bookingItems]);

  useEffect(() => {
    if (!didInitializeSelections.current) return;
    if (!didSkipInitialStoreSync.current) {
      didSkipInitialStoreSync.current = true;
      return;
    }

    const items = allSelections.map((cell) => ({
      slotId: cell.slotId,
      courtId: cell.courtId,
      courtName: cell.courtName,
      timeSlot: cell.time,
      price: cell.price,
      normalPrice: cell.normalPrice,
      discountPrice: cell.discountPrice,
      date: cell.dateKey,
      endTime: getEndTime(cell.time)
    }));

    setBookingItems(items);
  }, [allSelections, setBookingItems]);

  const handleSelectDate = (date: Date | null) => {
    if (!date) return;

    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    setSelectedDate(formattedDate);

    const el = document.getElementById(`date-${formattedDate}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const handleBooking = () => {
    if (bookingItems.length === 0) {
      toast.error('Pilih minimal satu jadwal lapangan.');
      return;
    }

    setBookingDate(dayjs(selectedDate).toDate());

    if (embedded) {
      setCartOpen(true);
      return;
    }

    router.push('/checkout');
  };

  return (
    <>
      {!embedded && (
        <MainHeader backHref="/" title="Booking Court" withLogo={false} withCartBadge withBorder />
      )}

      <main
        className={cn(
          'flex h-[calc(100dvh-180px)] w-full flex-col',
          embedded
            ? 'lg:h-[calc(100dvh-250px)]'
            : 'lg:relative lg:left-1/2 lg:h-[calc(100dvh-5rem)] lg:w-dvw lg:max-w-none lg:-translate-x-1/2'
        )}
      >
        <div className="sticky top-24 z-30 border-b bg-white pb-3 lg:static lg:top-14 lg:pt-2 lg:pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-2 pl-4">
              <DatePickerModal onChange={handleSelectDate} label="Select Booking Date">
                <DatePickerModalTrigger>
                  <Button variant="light" size="icon-lg" className="p-2">
                    <IconCalendarFilled className="text-primary size-6" />
                  </Button>
                </DatePickerModalTrigger>
              </DatePickerModal>
            </div>

            <Separator orientation="vertical" className="h-10" />

            <div className="scrollbar-hide flex flex-nowrap gap-2 overflow-x-auto px-2">
              {dateList.map((d) => (
                <button
                  id={`date-${d.fullDate}`}
                  key={d.fullDate}
                  className={cn(
                    'flex h-14 min-w-14 flex-col items-center justify-center rounded px-2 py-1 font-semibold transition-all md:h-16 md:min-w-16 md:px-3 md:hover:scale-[1.03]',
                    selectedDate === d.fullDate
                      ? 'bg-primary text-white'
                      : 'text-black hover:bg-orange-100'
                  )}
                  onClick={() => setSelectedDate(d.fullDate)}
                >
                  <span className="text-xs font-normal">{d.label}</span>
                  <div className="mt-0.5 flex">
                    <span className="me-0.5 text-sm font-semibold">
                      {dayjs(d.fullDate).format('DD')}
                    </span>
                    <span className="text-sm font-semibold">{dayjs(d.fullDate).format('MMM')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="scrollbar-hide flex-1 overflow-auto pb-10 lg:min-h-0 lg:pb-0">
          {isSlotsLoading && (
            <div className="text-muted-foreground p-4 text-center text-sm">Memuat slot...</div>
          )}

          <table className="min-w-full border-separate border-spacing-0 border border-gray-200 text-center">
            <thead className="sticky top-0 z-20 bg-gray-50/90 shadow-sm backdrop-blur md:text-sm md:tracking-tight">
              <tr>
                <th className="sticky left-0 z-30 w-20 border-r border-b bg-gray-50 px-2 py-2 text-left font-semibold" />
                {courts.map((court) => (
                  <th
                    key={court.id}
                    className="border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold"
                  >
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 text-gray-700"
                      onClick={() => setSelectedCourt(court)}
                    >
                      {court.name}
                      <IconInfoCircle className="inline-block size-4" />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {availableTimeSlots.map((time) => (
                <tr key={time}>
                  <td className="sticky left-0 z-10 w-20 border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium">
                    {time}
                  </td>
                  {courts.map((court) => {
                    const slot = slotMap.get(`${court.id}-${time}`);
                    const hasSlot = !!slot;
                    const isAvailable = !!slot?.isAvailable;
                    const selected = selectedCells.some(
                      (cell) => cell.courtId === court.id && cell.time === time
                    );
                    const normalPrice = slot?.price ?? 0;
                    const discountPrice = slot?.discountPrice ?? 0;
                    const effectivePrice = discountPrice > 0 ? discountPrice : normalPrice;

                    return (
                      <td key={court.id} className="border border-gray-200 p-1">
                        <button
                          disabled={!hasSlot || !isAvailable}
                          className={cn(
                            'flex h-14 w-full flex-col items-start justify-between rounded px-2 py-1 text-base font-semibold transition-all',
                            !hasSlot
                              ? 'text-muted-foreground cursor-not-allowed bg-gray-100'
                              : !isAvailable
                                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                : selected
                                  ? 'bg-primary text-white shadow-lg'
                                  : 'bg-white hover:bg-orange-100'
                          )}
                          onClick={() => {
                            if (!slot || !isAvailable) return;

                            setSelectionsByDate((prev) => {
                              const dateKey = selectedDate;
                              const currentSelections = prev[dateKey] ?? [];
                              const exists = currentSelections.some(
                                (cell) => cell.courtId === court.id && cell.time === time
                              );

                              const updatedSelections = exists
                                ? currentSelections.filter(
                                    (cell) => !(cell.courtId === court.id && cell.time === time)
                                  )
                                : [
                                    ...currentSelections,
                                    {
                                      slotId: slot.id,
                                      courtId: court.id,
                                      courtName: court.name,
                                      time,
                                      price: effectivePrice,
                                      normalPrice,
                                      discountPrice,
                                      dateKey
                                    }
                                  ];

                              const next = { ...prev };
                              if (updatedSelections.length > 0) {
                                next[dateKey] = updatedSelections;
                              } else {
                                delete next[dateKey];
                              }

                              return next;
                            });
                          }}
                        >
                          {hasSlot ? (
                            <>
                              {discountPrice > 0 && discountPrice < normalPrice ? (
                                <span className="flex flex-col items-start text-xs">
                                  <span className="text-[10px] text-gray-400 line-through">
                                    Rp{normalPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-sm font-semibold',
                                      selected ? 'text-white' : 'text-primary'
                                    )}
                                  >
                                    Rp{effectivePrice.toLocaleString('id-ID')}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm">
                                  Rp{effectivePrice.toLocaleString('id-ID')}
                                </span>
                              )}
                              {!isAvailable && <span className="text-xs">Booked</span>}
                            </>
                          ) : (
                            <span className="text-xs">Booked</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pointer-events-none h-2 lg:hidden" />
        </div>
      </main>

      <Dialog open={!!selectedCourt} onOpenChange={() => setSelectedCourt(null)}>
        <DialogContent className="w-11/12">
          {selectedCourt && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourt.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-1">
                <Image
                  src={
                    selectedCourt.image ||
                    getPlaceholderImageUrl({ width: 600, height: 400, text: 'No Image' })
                  }
                  alt={selectedCourt.name}
                  width={600}
                  height={400}
                  className="w-full rounded-sm object-cover"
                  unoptimized
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {bookingItems.length > 0 && (
        <BookingCartBubble
          itemCount={bookingItems.length}
          subtotal={courtTotal}
          onProceed={handleBooking}
        />
      )}

      {!embedded && (
        <BottomNavigationWrapper className="pb-4">
          <header className="flex-between my-2 items-end">
            <div>
              <span className="text-muted-foreground text-xs">Subtotal</span>
              <h2 className="text-lg font-semibold">Rp{courtTotal.toLocaleString('id-ID')}</h2>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">
                {bookingItems.length} Slot Terpilih
              </span>
            </div>
          </header>
          <main className="flex gap-2">
            <Button
              className="w-full"
              size="xl"
              onClick={handleBooking}
              disabled={bookingItems.length === 0}
            >
              Pilih Jadwal
            </Button>
          </main>
        </BottomNavigationWrapper>
      )}
    </>
  );
}
