'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const mondayOf = (date: Date) =>
  dayjs(date)
    .startOf('day')
    .subtract((dayjs(date).day() + 6) % 7, 'day');

export default function ScheduleDateFilter({
  selectedDate,
  onSelect
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) {
  const [rangeStart, setRangeStart] = useState(() => mondayOf(selectedDate));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dates = Array.from({ length: 14 }, (_, index) => rangeStart.add(index, 'day').locale('id'));

  const moveRange = (days: number) => {
    setRangeStart(rangeStart.add(days, 'day'));
    onSelect(dayjs(selectedDate).add(days, 'day').toDate());
  };

  return (
    <Card className="w-full min-w-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 sm:flex-row">
        <CardTitle>Filter Tanggal</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="14 hari sebelumnya"
            onClick={() => moveRange(-14)}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <IconCalendar className="size-4" />
                {dayjs(selectedDate).locale('id').format('DD MMM YYYY')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                defaultMonth={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  onSelect(date);
                  setRangeStart(mondayOf(date));
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="14 hari berikutnya"
            onClick={() => moveRange(14)}
          >
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div
          className="flex w-full gap-2 overflow-x-auto pb-2 lg:gap-3"
          role="group"
          aria-label="Pilih tanggal jadwal"
        >
          {dates.map((date) => {
            const selected = date.isSame(selectedDate, 'day');
            return (
              <Button
                key={date.format('YYYY-MM-DD')}
                type="button"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                aria-label={date.format('dddd, DD MMMM YYYY')}
                aria-current={date.isSame(dayjs(), 'day') ? 'date' : undefined}
                onClick={() => onSelect(date.toDate())}
                className={cn(
                  'h-auto min-h-24 min-w-16 flex-1 shrink-0 flex-col gap-2 rounded-none px-2 py-3 shadow-none',
                  !selected && date.isBefore(dayjs(), 'day') && 'text-muted-foreground'
                )}
              >
                <span className="text-xs font-medium">{date.format('ddd')}</span>
                <span className="text-xl leading-none font-bold">{date.format('D')}</span>
                <span className="text-xs font-normal">{date.format('MMM')}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
