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

export default function BookingDetailsCard({ details }: { details: Detail[] }) {
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
    <Card className="mb-4 gap-2 py-3">
      <CardHeader className="flex-row items-center justify-between px-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span>Jadwal Booking</span>
        </CardTitle>
        <span className="text-sm text-gray-500">{totalSlots} slot</span>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {Object.entries(grouped).map(([date, courts]) => (
          <div key={date} className="rounded-md border px-3 py-2">
            <p className="mb-2 text-sm font-semibold">{formatDateDisplay(date)}</p>
            <div className="space-y-2">
              {Object.entries(courts as Record<string, Detail[]>).map(([courtName, items]) => (
                <div key={courtName} className="flex items-center gap-2">
                  <div className="flex min-w-32 items-center gap-1.5 text-sm font-medium">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                    <span>{courtName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mergeConsecutiveSlots(items).map((range, idx) => (
                      <span
                        key={`${String(range.startAt)}-${idx}`}
                        className="flex items-center gap-1 rounded bg-gray-50 px-2 py-1 text-sm"
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
