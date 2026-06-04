'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { inventoryAvailabilityQueryOptions } from '@/queries/inventory';
import { useBookingStore, type BookingItem } from '@/stores/useBookingStore';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Minus, PackageCheck, Plus, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AddOnsPage() {
  const router = useRouter();
  const bookingItems = useBookingStore((state) => state.bookingItems) as BookingItem[];
  // const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  // const addCoachToStore = useBookingStore((state) => state.addCoach);
  // const removeCoachFromStore = useBookingStore((state) => state.removeCoach);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  const addInventoryToStore = useBookingStore((state) => state.addInventory);
  const removeInventoryFromStore = useBookingStore((state) => state.removeInventory);
  const [activeTab] = useState<'coach' | 'raket'>('raket');
  const {
    data: inventoryAvailability,
    isPending: isInventoryPending,
    isError: isInventoryError
  } = useQuery(inventoryAvailabilityQueryOptions);

  const bookingTimeRange = useMemo(() => {
    if (bookingItems.length === 0) {
      return { startAt: undefined as string | undefined, endAt: undefined as string | undefined };
    }

    const parseBookingTime = (date: string, time: string) => {
      const candidates = [`${date} ${time}`, `${date}T${time}`, date];

      for (const candidate of candidates) {
        const parsed = dayjs(candidate);
        if (parsed.isValid()) {
          return parsed;
        }
      }

      return null;
    };

    let earliestTimestamp: number | null = null;
    let earliestIso: string | undefined;
    let latestTimestamp: number | null = null;
    let latestIso: string | undefined;

    bookingItems.forEach((item) => {
      const start = parseBookingTime(item.date, item.timeSlot);
      const end = parseBookingTime(item.date, item.endTime ?? item.timeSlot);

      if (start) {
        const value = start.valueOf();
        if (earliestTimestamp === null || value < earliestTimestamp) {
          earliestTimestamp = value;
          earliestIso = start.toISOString();
        }
      }

      if (end) {
        const value = end.valueOf();
        if (latestTimestamp === null || value > latestTimestamp) {
          latestTimestamp = value;
          latestIso = end.toISOString();
        }
      }
    });

    const startAt = earliestIso;
    const endAt = latestIso;

    return {
      startAt,
      endAt
    };
  }, [bookingItems]);

  // const {
  //   data: coachAvailability,
  //   isPending: isCoachPending,
  //   isError: isCoachError
  // } = useQuery(coachAvailabilityQueryOptions(bookingTimeRange.startAt, bookingTimeRange.endAt));

  const hasBookingSelection = bookingItems.length > 0;
  // const coachList = coachAvailability ?? [];

  const inventoryList = inventoryAvailability ?? [];
  const inventoryTotal = selectedInventories.reduce((total, item) => total + item.price, 0);

  const primaryBookingDate = useMemo(() => {
    if (bookingTimeRange.startAt) {
      return dayjs(bookingTimeRange.startAt).format('YYYY-MM-DD');
    }

    return bookingItems[0]?.date ?? dayjs().format('YYYY-MM-DD');
  }, [bookingItems, bookingTimeRange.startAt]);

  // const handleCoachToggle = (item: any) => {
  //   if (!hasBookingSelection) {
  //     toast.error('Tambahkan booking lapangan terlebih dahulu sebelum memilih coach.');
  //     return;
  //   }

  //   if (!item?.slotId || !item?.coach?.id) {
  //     toast.error('Data coach tidak valid.');
  //     return;
  //   }

  //   const isSelected = selectedCoaches.some((coach) => coach.slotId === item.slotId);

  //   if (isSelected) {
  //     removeCoachFromStore(item.coach.id, item.startAt ?? '', item.slotId);
  //     toast.success(`${item.coach.name ?? 'Coach'} dihapus dari add-ons.`);
  //     return;
  //   }

  //   const start = item.startAt ? dayjs(item.startAt) : null;
  //   const end = item.endAt ? dayjs(item.endAt) : null;
  //   const timeSlot =
  //     start && end ? `${start.format('HH:mm')} - ${end.format('HH:mm')}` : 'Pilih jadwal coach';

  //   addCoachToStore({
  //     coachId: item.coach.id,
  //     coachName: item.coach.name ?? 'Coach',
  //     timeSlot,
  //     price: item.price ?? 0,
  //     date: start ? start.format('YYYY-MM-DD') : primaryBookingDate,
  //     slotId: item.slotId,
  //     coachTypeId: item.coachTypeId ?? null,
  //     startAt: item.startAt,
  //     endAt: item.endAt
  //   });

  //   toast.success(`${item.coach.name ?? 'Coach'} ditambahkan ke add-ons.`);
  // };

  const handleInventoryQtyChange = (inventoryId: string, nextQty: number) => {
    if (!hasBookingSelection) {
      toast.error('Tambahkan booking lapangan terlebih dahulu sebelum memilih peralatan.');
      return;
    }

    const selectedInventory = inventoryList.find((item) => item.id === inventoryId);
    if (!selectedInventory) {
      toast.error('Data inventori tidak valid.');
      return;
    }

    const availableQuantity = selectedInventory.availableQuantity ?? 0;
    const safeQty = Math.max(0, Math.min(nextQty, availableQuantity));

    const unitPrice = selectedInventory.price ?? 0;

    if (safeQty > 0) {
      addInventoryToStore({
        inventoryId: selectedInventory.id,
        inventoryName: selectedInventory.name,
        timeSlot: 'default',
        price: safeQty * unitPrice,
        quantity: safeQty,
        date: primaryBookingDate
      });
      toast.success(`${selectedInventory.name} ditambahkan (${safeQty} item).`);
    } else {
      removeInventoryFromStore(selectedInventory.id, 'default');
      toast.success(`${selectedInventory.name} dihapus dari add-ons.`);
    }
  };

  return (
    <>
      <MainHeader
        onBack={() => router.back()}
        title="Produk Tambahan"
        withLogo={false}
        withBorder
      />

      <main className="mx-auto h-screen w-11/12 pt-24 lg:relative lg:left-1/2 lg:min-h-screen lg:w-screen lg:max-w-none lg:-translate-x-1/2 lg:bg-neutral-50 lg:pt-28 lg:pb-16">
        <div className="mx-auto grid w-full gap-6 lg:w-11/12 lg:max-w-7xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-4">
          <section className="space-y-6">
            <div className="hidden border bg-white p-6 lg:block">
              <p className="text-primary text-sm font-semibold">Add-Ons</p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal">Produk Tambahan</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Tambahkan perlengkapan untuk melengkapi jadwal bermain yang sudah kamu pilih.
              </p>
            </div>

            {!hasBookingSelection && (
              <Card className="lg:border-neutral-200 lg:bg-white">
                <div className="px-4 py-3 lg:p-6">
                  <p className="font-semibold">Belum ada booking lapangan</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Tambahkan pemesanan lapangan terlebih dahulu sebelum memilih add-ons.
                  </p>
                  <Button className="mt-4" onClick={() => router.push('/booking')}>
                    Pilih Jadwal
                  </Button>
                </div>
              </Card>
            )}

        {/* Tabs utama */}
        {/* <div className="mb-4 flex gap-2">
          {['Coach', 'Raket'].map((item) => (
            <Button
              key={item}
              variant={activeTab === item.toLowerCase().replace(' ', '') ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab(item.toLowerCase().replace(' ', '') as any)}
            >
              {item}
            </Button>
          ))}
        </div> */}

        {/* === COACH LIST === */}
        {/* {activeTab === 'coach' && (
          <div className="mb-4 flex flex-col gap-3">
            {!hasBookingSelection && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">
                    Tambahkan pemesanan lapangan terlebih dahulu untuk melihat ketersediaan coach.
                  </p>
                </div>
              </Card>
            )}

            {hasBookingSelection && isCoachPending && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">Memuat daftar coach...</p>
                </div>
              </Card>
            )}

            {hasBookingSelection && isCoachError && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-destructive text-sm">Gagal memuat ketersediaan coach.</p>
                </div>
              </Card>
            )}

            {hasBookingSelection && !isCoachPending && !isCoachError && coachList.length === 0 && (
              <Card>
                <div className="px-4 py-3">
                  <p className="text-muted-foreground text-sm">Coach tidak tersedia.</p>
                </div>
              </Card>
            )}

            {hasBookingSelection &&
              coachList.map((item) => {
                const coachPrice =
                  typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
                const coachName = item.coach?.name ?? 'Coach';
                const coachImage =
                  item.coach?.image && item.coach.image.trim() !== ''
                    ? item.coach.image
                    : '/assets/img/avatar.webp';
                const scheduleRange = item.startAt
                  ? `${dayjs(item.startAt).format('DD MMM YYYY HH:mm')} - ${dayjs(item.endAt).format('HH:mm')}`
                  : '';
                const isSelected = selectedCoaches.some((coach) => coach.slotId === item.slotId);

                return (
                  <Card
                    key={item.slotId}
                    onClick={() => handleCoachToggle(item)}
                    className={cn(
                      'hover:border-primary cursor-pointer transition',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="space-y-3 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="shrink-0 overflow-hidden rounded-full bg-gray-200">
                            <Image
                              src={coachImage}
                              alt={coachName}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-semibold">{coachName}</p>
                            <p className="text-muted-foreground text-xs">
                              {scheduleRange || 'Pilih jadwal coach'}
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Dipilih
                          </Badge>
                        ) : (
                          <ChevronRight className="text-primary" />
                        )}
                      </div>

                      <div className="bg-muted flex items-center justify-between rounded-sm px-4 py-2">
                        <p className="text-foreground">
                          <span className="text-primary font-semibold">
                            Rp{coachPrice.toLocaleString('id-ID')}{' '}
                          </span>
                          <span className="text-muted-foreground text-sm">/sesi</span>
                        </p>
                        <Button
                          size="sm"
                          variant={isSelected ? 'outline' : 'secondary'}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCoachToggle(item);
                          }}
                        >
                          {isSelected ? 'Batalkan' : 'Tambah'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )} */}

        {/* === RAKET === */}
        {activeTab === 'raket' && (
          <div className="mb-4 flex flex-col gap-3 lg:mb-0 lg:grid lg:grid-cols-2 lg:gap-5">
            {isInventoryPending && (
              <Card className="lg:col-span-2 lg:border-neutral-200 lg:bg-white">
                <div className="px-4 py-3 lg:p-6">
                  <p className="text-muted-foreground text-sm">Memuat ketersediaan...</p>
                </div>
              </Card>
            )}

            {isInventoryError && (
              <Card className="lg:col-span-2 lg:border-neutral-200 lg:bg-white">
                <div className="px-4 py-3 lg:p-6">
                  <p className="text-destructive text-sm">Gagal memuat ketersediaan inventori.</p>
                </div>
              </Card>
            )}

            {!isInventoryPending && !isInventoryError && inventoryList.length === 0 && (
              <Card className="lg:col-span-2 lg:border-neutral-200 lg:bg-white">
                <div className="px-4 py-3 lg:p-6">
                  <p className="text-muted-foreground text-sm">Inventori tidak tersedia.</p>
                </div>
              </Card>
            )}

            {!isInventoryPending &&
              !isInventoryError &&
              inventoryList.map((inventory) => {
                const selectedQty =
                  selectedInventories.find(
                    (item) =>
                      item.inventoryId === inventory.id &&
                      (item.timeSlot ?? 'default') === 'default'
                  )?.quantity ?? 0;
                const availableQuantity = inventory.availableQuantity ?? 0;
                const unitPrice = inventory.price ?? 0;

                return (
                  <Card
                    key={inventory.id}
                    className="lg:h-full lg:border-neutral-200 lg:bg-white lg:transition-shadow lg:hover:shadow-md"
                  >
                    <div className="px-4 py-3 lg:flex lg:h-full lg:flex-col lg:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 text-primary hidden size-12 items-center justify-center lg:flex">
                            <PackageCheck className="size-6" />
                          </div>
                          <div>
                          <p className="font-semibold lg:text-lg">{inventory.name}</p>
                          <p className="text-muted-foreground text-xs">
                            Tersedia {availableQuantity} equipment
                          </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInventoryQtyChange(inventory.id, selectedQty - 1)}
                            disabled={selectedQty <= 0}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-6 text-center font-semibold">{selectedQty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInventoryQtyChange(inventory.id, selectedQty + 1)}
                            disabled={selectedQty >= availableQuantity || availableQuantity === 0}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted mt-4 flex rounded-sm px-4 py-2 lg:mt-auto lg:rounded-none">
                        <p className="text-foreground">
                          <span className="text-primary font-semibold">
                            Rp{unitPrice.toLocaleString('id-ID')}{' '}
                          </span>
                          <span className="text-muted-foreground text-sm">/equipment</span>
                        </p>
                      </div>

                      {selectedQty > 0 && (
                        <p className="text-primary mt-2 text-sm font-medium">
                          Total: Rp{(selectedQty * unitPrice).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
          </section>

          <aside className="hidden lg:block">
            <Card className="sticky top-28 border-neutral-200 bg-white py-0">
              <div className="space-y-6 p-6">
                <div>
                  <div className="bg-primary/10 text-primary flex size-12 items-center justify-center">
                    <ShoppingCart className="size-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold">Ringkasan Add-Ons</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {selectedInventories.length} produk dipilih
                  </p>
                </div>

                <div className="space-y-3 border-t pt-5">
                  {selectedInventories.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Belum ada produk tambahan.</p>
                  ) : (
                    selectedInventories.map((item) => (
                      <div
                        key={`${item.inventoryId}-${item.timeSlot ?? 'default'}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium">{item.inventoryName}</p>
                          <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">Rp{item.price.toLocaleString('id-ID')}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Add-Ons</span>
                    <span className="text-primary text-lg font-bold">
                      Rp{inventoryTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <Button className="mt-5 w-full" size="lg" onClick={() => router.push('/checkout')}>
                    Lanjut Checkout
                  </Button>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      {/* Seleksi coach & inventori langsung melalui kartu */}
    </>
  );
}
