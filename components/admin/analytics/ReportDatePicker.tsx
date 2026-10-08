'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ReportDatePicker({
  value,
  onChange,
  label,
  mode = 'date'
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  mode?: 'date' | 'month';
}) {
  const [open, setOpen] = useState(false);
  const selected = value
    ? new Date(`${value}${mode === 'month' ? '-01' : ''}T00:00:00`)
    : undefined;
  const [year, setYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear());
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setYear(selected?.getFullYear() ?? new Date().getFullYear());
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          {selected
            ? format(selected, mode === 'month' ? 'MMMM yyyy' : 'dd MMM yyyy', { locale: localeId })
            : 'Rentang kustom'}
          <CalendarDays className="text-muted-foreground size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        avoidCollisions={false}
        className="max-h-[min(420px,65vh)] w-auto overflow-y-auto p-0"
        aria-label={label}
      >
        {mode === 'month' ? (
          <div className="w-72 p-3">
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tahun sebelumnya"
                onClick={() => setYear(year - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-semibold" aria-live="polite">
                {year}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tahun berikutnya"
                onClick={() => setYear(year + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, index) => {
                const date = new Date(year, index, 1);
                const key = format(date, 'yyyy-MM');
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={value === key ? 'default' : 'ghost'}
                    aria-pressed={value === key}
                    aria-label={format(date, 'MMMM yyyy', { locale: localeId })}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {format(date, 'MMM', { locale: localeId })}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <Calendar
            mode="single"
            locale={localeId}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, 'yyyy-MM-dd'));
                setOpen(false);
              }
            }}
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
