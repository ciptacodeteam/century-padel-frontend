'use client';

import { getVenueTodayLocalDate } from '@/lib/venue-date';
import { useEffect, useState } from 'react';
import { Calendar } from './calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogTriggerProps
} from './dialog';

type DatePickerModalTriggerProps = DialogTriggerProps & { children?: React.ReactNode };

function DatePickerModalTrigger({ children, ...props }: DatePickerModalTriggerProps) {
  return (
    <DialogTrigger asChild {...props}>
      {children}
    </DialogTrigger>
  );
}

type DatePickerModalProps = {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  maxDate?: Date;
  children?: React.ReactNode;
};

function DatePickerModal({
  value,
  onChange,
  label = 'Select Date',
  maxDate,
  children
}: DatePickerModalProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | null>(value ?? null);

  useEffect(() => {
    setInternalValue(value ?? null);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    setInternalValue(date ?? null);
    if (onChange) onChange(date ?? null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="max-w-xs p-0 md:max-w-sm">
        <DialogHeader className="mx-auto pt-5">
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="flex-center p-4 pt-0">
          <Calendar
            mode="single"
            disabled={(date) => {
              const today = getVenueTodayLocalDate();
              if (date < today) return true;
              if (maxDate) {
                const max = new Date(maxDate);
                max.setHours(23, 59, 59, 999);
                if (date > max) return true;
              }
              return false;
            }}
            classNames={{
              root: 'w-full'
            }}
            fromYear={getVenueTodayLocalDate().getFullYear()}
            toYear={maxDate ? maxDate.getFullYear() : getVenueTodayLocalDate().getFullYear() + 5}
            captionLayout="dropdown"
            selected={internalValue ?? undefined}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DatePickerModal, DatePickerModalTrigger };
