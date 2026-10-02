import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSlotTime } from '@/lib/time-utils';
import { Calendar, Clock, MapPin } from 'lucide-react';

type Detail = any;

type TimeRange = {
  startAt: string | Date;
  endAt: string | Date;
};

const mergeConsecutiveSlots = (items: Detail[]): TimeRange[] => {
  const sortedSlots = items
    .filter((item) => item.slot?.startAt && item.slot?.endAt)
    .map((item) => ({ startAt: item.slot.startAt, endAt: item.slot.endAt }))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return sortedSlots.reduce<TimeRange[]>((ranges, slot) => {
    const previousRange = ranges[ranges.length - 1];
    const isConsecutive =
      previousRange && new Date(previousRange.endAt).getTime() === new Date(slot.startAt).getTime();

    if (isConsecutive) {
      previousRange.endAt = slot.endAt;
    } else {
      ranges.push({ ...slot });
    }

    return ranges;
  }, []);
};

// Helper to extract date string from ISO string without timezone conversion
const getDateStringFromISO = (isoString: string): string => {
  const isoRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const match = isoString.match(isoRegex);

  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback to Date parsing if regex doesn't match
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format date for display
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const dayName = dayNames[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

export default function BookingDetailsCard({
  details,
  receipt = false
}: {
  details: Detail[];
  receipt?: boolean;
}) {
  const grouped = (details || []).reduce(
    (acc: any, detail: any) => {
      const slotStartAt = detail.slot?.startAt;
      if (!slotStartAt) return acc;

      const date =
        typeof slotStartAt === 'string'
          ? getDateStringFromISO(slotStartAt)
          : getDateStringFromISO(slotStartAt.toISOString());
      const courtName = detail.court?.name || detail.slot?.court?.name || 'Unknown Court';

      if (!acc[date]) acc[date] = {};
      if (!acc[date][courtName]) acc[date][courtName] = [];
      acc[date][courtName].push(detail);
      return acc;
    },
    {} as Record<string, Record<string, Detail[]>>
  );

  const totalSlots = (details || []).length;

  return (
    <Card
      className={
        receipt
          ? 'gap-0 rounded-none border-x-0 border-b-0 py-0 shadow-none'
          : 'gap-0 overflow-hidden rounded-xl py-0 shadow-sm'
      }
    >
      <CardHeader className="flex-row items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-8 sm:py-6">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <span className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
            <Calendar className="text-primary h-4 w-4" />
          </span>
          <span>Jadwal Booking</span>
        </CardTitle>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:text-sm">
          {totalSlots} slot
        </span>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5 sm:px-8 sm:py-6">
        {Object.entries(grouped).map(([date, courts]) => (
          <div key={date} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
            <p className="mb-4 text-sm font-semibold text-gray-950 sm:text-base">
              {formatDateDisplay(date)}
            </p>
            <div className="space-y-4">
              {Object.entries(courts as Record<string, Detail[]>).map(([courtName, items]) => (
                <div
                  key={courtName}
                  className="grid gap-3 sm:grid-cols-[minmax(8rem,0.45fr)_1fr] sm:items-start"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="text-primary h-4 w-4 shrink-0" />
                    <span className="break-words">{courtName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6 sm:pl-0">
                    {mergeConsecutiveSlots(items).map((range, idx) => (
                      <span
                        key={`${String(range.startAt)}-${idx}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        {formatSlotTime(range.startAt, 'HH:mm')}–
                        {formatSlotTime(range.endAt, 'HH:mm')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
