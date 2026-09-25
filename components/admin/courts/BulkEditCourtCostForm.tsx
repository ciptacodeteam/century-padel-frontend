'use client';

import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import { DialogFooter } from '@/components/ui/dialog';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldLabel } from '@/components/ui/field';
import MultiSelectInput from '@/components/ui/multi-select-input';
import { NumberInput } from '@/components/ui/number-input';
import { daysOfWeek, hoursInDay } from '@/lib/constants';
import { formatSlotTime } from '@/lib/time-utils';
import { adminBulkUpdateSlotPriceMutationOptions } from '@/mutations/admin/court';
import { adminCourtCostingQueryOptionsById } from '@/queries/admin/court';
import type { Slot } from '@/types/model';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

type Props = {
  courtId: string;
  slots: Slot[];
  dialogId: string;
};

const getSlotDate = (slot: Slot) => formatSlotTime(slot.startAt, 'YYYY-MM-DD');

export default function BulkEditCourtCostForm({ courtId, slots, dialogId }: Props) {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();

  const availableDates = useMemo(
    () => [...new Set(slots.map(getSlotDate).filter(Boolean))].sort(),
    [slots]
  );
  const today = dayjs().format('YYYY-MM-DD');
  const firstSelectableDate = availableDates.find((date) => date >= today) ?? availableDates[0];
  const lastSelectableDate = availableDates.at(-1) ?? firstSelectableDate;

  const [fromDate, setFromDate] = useState<Date | null>(
    firstSelectableDate ? dayjs(firstSelectableDate).toDate() : dayjs().toDate()
  );
  const [toDate, setToDate] = useState<Date | null>(
    firstSelectableDate ? dayjs(firstSelectableDate).toDate() : dayjs().toDate()
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);

  const hourOptions = useMemo(() => {
    const availableHours = new Set(
      slots
        .map((slot) => Number.parseInt(formatSlotTime(slot.startAt).split(':')[0] ?? '', 10))
        .filter((hour) => Number.isInteger(hour))
    );
    return hoursInDay.filter((hour) => availableHours.has(hour.value));
  }, [slots]);

  const fromDateKey = fromDate ? dayjs(fromDate).format('YYYY-MM-DD') : '';
  const toDateKey = toDate ? dayjs(toDate).format('YYYY-MM-DD') : '';

  const selectedSlotIds = useMemo(() => {
    if (!fromDateKey || !toDateKey || selectedDays.length === 0 || selectedHours.length === 0) {
      return [];
    }

    return slots
      .filter((slot) => {
        const date = getSlotDate(slot);
        const weekday = dayjs(date).day() || 7;
        const hour = Number.parseInt(formatSlotTime(slot.startAt).split(':')[0] ?? '', 10);

        return (
          date >= fromDateKey &&
          date <= toDateKey &&
          selectedDays.includes(weekday) &&
          selectedHours.includes(hour)
        );
      })
      .map((slot) => slot.id);
  }, [fromDateKey, selectedDays, selectedHours, slots, toDateKey]);

  const isDateRangeInvalid = !!fromDateKey && !!toDateKey && fromDateKey > toDateKey;
  const isPriceInvalid = price <= 0;
  const isDiscountInvalid = discountPrice > price;

  const { mutate: updateBulkPricing, isPending } = useMutation(
    adminBulkUpdateSlotPriceMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        queryClient.invalidateQueries({ queryKey: ['courts', 'slots'] });
        closeDialog(dialogId);
      }
    })
  );

  const canSubmit =
    selectedSlotIds.length > 0 &&
    !isDateRangeInvalid &&
    !isPriceInvalid &&
    !isDiscountInvalid &&
    !isPending;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        updateBulkPricing({ courtId, slotIds: selectedSlotIds, price, discountPrice });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Mulai Tanggal</FieldLabel>
          <DatePickerInput
            value={fromDate}
            onValueChange={(date) => setFromDate(date ?? null)}
            minDate={firstSelectableDate ? dayjs(firstSelectableDate).toDate() : undefined}
            maxDate={lastSelectableDate ? dayjs(lastSelectableDate).toDate() : undefined}
          />
        </Field>
        <Field>
          <FieldLabel>Sampai Tanggal</FieldLabel>
          <DatePickerInput
            value={toDate}
            onValueChange={(date) => setToDate(date ?? null)}
            minDate={fromDate ?? undefined}
            maxDate={lastSelectableDate ? dayjs(lastSelectableDate).toDate() : undefined}
          />
        </Field>
      </div>

      {isDateRangeInvalid && (
        <p className="text-destructive text-xs">Tanggal akhir tidak boleh sebelum tanggal mulai.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Hari yang Diubah</FieldLabel>
          <MultiSelectInput
            options={daysOfWeek.map((day) => ({
              label: day.label,
              value: String(day.value)
            }))}
            value={daysOfWeek
              .filter((day) => selectedDays.includes(day.value))
              .map((day) => ({ label: day.label, value: String(day.value) }))}
            onChange={(options) => setSelectedDays(options.map((option) => Number(option.value)))}
            placeholder="Pilih satu atau beberapa hari"
            emptyIndicator="Hari tidak ditemukan"
          />
        </Field>
        <Field>
          <FieldLabel>Jam yang Diubah</FieldLabel>
          <MultiSelectInput
            options={hourOptions.map((hour) => ({
              label: hour.label,
              value: String(hour.value)
            }))}
            value={hourOptions
              .filter((hour) => selectedHours.includes(hour.value))
              .map((hour) => ({ label: hour.label, value: String(hour.value) }))}
            onChange={(options) => setSelectedHours(options.map((option) => Number(option.value)))}
            placeholder="Pilih satu atau beberapa jam"
            emptyIndicator="Jam tidak ditemukan"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Harga Normal Baru</FieldLabel>
          <NumberInput
            thousandSeparator="."
            decimalSeparator=","
            prefix="Rp "
            min={1}
            allowNegative={false}
            value={price}
            onValueChange={(value) => setPrice(value || 0)}
            withControl={false}
          />
        </Field>
        <Field>
          <FieldLabel>Harga Diskon Baru</FieldLabel>
          <NumberInput
            thousandSeparator="."
            decimalSeparator=","
            prefix="Rp "
            min={0}
            allowNegative={false}
            value={discountPrice}
            onValueChange={(value) => setDiscountPrice(value || 0)}
            withControl={false}
          />
        </Field>
      </div>

      {isDiscountInvalid && (
        <p className="text-destructive text-xs">Harga diskon tidak boleh melebihi harga normal.</p>
      )}

      {isPriceInvalid && (
        <p className="text-destructive text-xs">Harga normal harus lebih dari Rp0.</p>
      )}

      <div className="bg-muted rounded-md border p-3 text-sm">
        <span className="font-semibold">{selectedSlotIds.length} slot</span> akan diperbarui.
        <p className="text-muted-foreground mt-1 text-xs">
          Slot yang sudah memiliki booking aktif akan dilewati secara otomatis.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => closeDialog(dialogId)}>
          Batal
        </Button>
        <Button type="submit" disabled={!canSubmit} loading={isPending}>
          Terapkan Bulk Edit
        </Button>
      </DialogFooter>
    </form>
  );
}
