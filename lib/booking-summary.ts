import { formatSlotTime, toLocalSlotDate } from './time-utils';

type SummaryDetail = {
  courtId?: string | null;
  court?: { id?: string; name?: string } | null;
  slot?: {
    courtId?: string | null;
    court?: { id?: string; name?: string };
    startAt?: string | Date;
    endAt?: string | Date;
  };
};

export function summarizeBookingSlots(details: SummaryDetail[]) {
  const groups = new Map<string, Array<{ courtName: string; startAt: Date; endAt: Date }>>();
  for (const detail of details) {
    const startAt = toLocalSlotDate(detail.slot?.startAt);
    const endAt = toLocalSlotDate(detail.slot?.endAt);
    if (!startAt || !endAt) continue;
    const court = detail.court || detail.slot?.court;
    const courtName = court?.name || 'Court';
    const key = `${detail.courtId || court?.id || detail.slot?.courtId || courtName}:${formatSlotTime(startAt, 'YYYY-MM-DD')}`;
    const group = groups.get(key) || [];
    group.push({ courtName, startAt, endAt });
    groups.set(key, group);
  }
  return Array.from(groups.values())
    .flatMap((group) => {
      const ranges: typeof group = [];
      for (const slot of group.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())) {
        const previous = ranges[ranges.length - 1];
        if (previous && previous.endAt.getTime() === slot.startAt.getTime()) {
          previous.endAt = slot.endAt;
        } else {
          ranges.push({ ...slot });
        }
      }
      return ranges;
    })
    .sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime() || a.courtName.localeCompare(b.courtName)
    );
}
