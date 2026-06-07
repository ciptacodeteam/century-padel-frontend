import type { BookingItem } from '@/stores/useBookingStore';

export type BookingSelection = {
  slotId: string;
  courtId: string;
  courtName: string;
  time: string;
  price: number;
  normalPrice?: number;
  discountPrice?: number;
  dateKey: string;
};

export const getEndTime = (timeSlot: string) => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeSlot;

  return `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const mapSelectionsToBookingItems = (selections: BookingSelection[]): BookingItem[] =>
  selections.map((cell) => ({
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

export const bookingItemsToSelectionsByDate = (
  items: BookingItem[]
): Record<string, BookingSelection[]> =>
  items.reduce<Record<string, BookingSelection[]>>((acc, item) => {
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

export const hasSlotDiscount = (item: {
  normalPrice?: number;
  discountPrice?: number;
  price: number;
}) => {
  const normalPrice = item.normalPrice ?? item.price;
  const discountPrice = item.discountPrice ?? 0;
  return discountPrice > 0 && discountPrice < normalPrice;
};
