'use client';

import { Badge } from '@/components/ui/badge';
import { bulkSlotAvailabilityApi } from '@/api/admin/court';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReportDatePicker from '@/components/admin/analytics/ReportDatePicker';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { NumberInput } from '@/components/ui/number-input';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ManagedDialog, useDialog } from '@/components/ui/dialog-context';
import { formatSlotTimeRange } from '@/lib/time-utils';
import { adminCourtCostingQueryOptionsById } from '@/queries/admin/court';
import {
  adminUpdateSlotPriceMutationOptions,
  adminUpdateSlotAvailabilityMutationOptions
} from '@/mutations/admin/court';
import type { Slot } from '@/types/model';
import { IconEdit, IconPencil, IconPlus, IconPower } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateCourtCostForm from './CreateCourtCostForm';
import BulkEditCourtCostForm from './BulkEditCourtCostForm';

type Props = {
  courtId: string;
};

type ToggleSlotModalProps = {
  slot: Slot;
  courtId: string;
  dialogId: string;
};

type EditSlotModalProps = {
  slot: Slot;
  courtId: string;
  dialogId: string;
};

const ToggleSlotModal = ({ slot, courtId, dialogId }: ToggleSlotModalProps) => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const isAvailable = slot.isAvailable;

  const { mutate: updateSlotAvailability, isPending: isUpdating } = useMutation(
    adminUpdateSlotAvailabilityMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        closeDialog(dialogId);
      }
    })
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ubah Status Slot</DialogTitle>
        <DialogDescription>
          Slot: {formatSlotTimeRange(slot.startAt, slot.endAt)}
          <br />
          Status saat ini: <strong>{isAvailable ? 'Tersedia' : 'Tidak Tersedia'}</strong>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => closeDialog(dialogId)}>
          Batal
        </Button>
        <Button
          variant={isAvailable ? 'destructive' : 'default'}
          onClick={() => {
            updateSlotAvailability({ slotId: slot.id, isAvailable: !isAvailable });
          }}
          disabled={isUpdating}
        >
          {isUpdating ? 'Memproses...' : isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const EditSlotModal = ({ slot, courtId, dialogId }: EditSlotModalProps) => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(slot.price || 0);
  const [discountPrice, setDiscountPrice] = useState(slot.discountPrice || 0);

  const isPriceInvalid = price <= 0;
  const isDiscountInvalid = (discountPrice || 0) > (price || 0);

  const { mutate: updateSlotPrice, isPending: isUpdating } = useMutation(
    adminUpdateSlotPriceMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        closeDialog(dialogId);
      }
    })
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ubah Harga Slot</DialogTitle>
        <DialogDescription>Slot: {formatSlotTimeRange(slot.startAt, slot.endAt)}</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateSlotPrice({
            slotId: slot.id,
            price: price || 0,
            discountPrice: discountPrice || 0
          });
        }}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Harga Normal</p>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={1}
              allowNegative={false}
              placeholder="e.g. Rp 100.000"
              value={price}
              onValueChange={(value) => setPrice(value || 0)}
              withControl={false}
            />
            {isPriceInvalid && (
              <p className="text-destructive text-xs">Harga normal harus lebih dari Rp0.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Harga Diskon</p>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={0}
              allowNegative={false}
              placeholder="e.g. Rp 80.000"
              value={discountPrice}
              onValueChange={(value) => setDiscountPrice(value || 0)}
              withControl={false}
            />
            {isDiscountInvalid && (
              <p className="text-destructive text-xs">
                Harga diskon tidak boleh melebihi harga normal.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(dialogId)}>
            Batal
          </Button>
          <Button type="submit" disabled={isUpdating || isPriceInvalid || isDiscountInvalid}>
            {isUpdating ? 'Memproses...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const CourtCostingTable = ({ courtId }: Props) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [action, setAction] = useState<boolean | null>(null);
  const [result, setResult] = useState<string>('');
  const bulk = useMutation({
    mutationFn: ({ ids, available }: { ids: string[]; available: boolean }) =>
      bulkSlotAvailabilityApi(courtId, ids, available),
    onSuccess: (data) => {
      setResult(
        `${data.updated} slot diperbarui · ${data.skipped} slot dibooking dilewati · ${data.unchanged} slot sudah sesuai.`
      );
      setSelected([]);
      setAction(null);
      queryClient.invalidateQueries({
        queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
      toast.success('Status slot berhasil diperbarui.');
    },
    onError: () => toast.error('Gagal memperbarui slot. Muat ulang data dan coba kembali.')
  });
  const colHelper = createColumnHelper<{ date: string; slots: Slot[] }>();

  const columns = useMemo(
    () => [
      colHelper.accessor('date', {
        header: 'Tanggal',
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            {row.getCanExpand() ? (
              <Button
                variant="ghost"
                size="icon"
                className="opacity-50"
                {...{
                  onClick: row.getToggleExpandedHandler(),
                  style: { cursor: 'pointer' }
                }}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="rotate-180 transition-transform" />
                ) : (
                  <ChevronRight />
                )}
              </Button>
            ) : null}
            {dayjs(getValue()).format('DD/MM/YYYY')}
          </div>
        )
      })
    ],
    [colHelper]
  );

  const { data, isPending } = useQuery(adminCourtCostingQueryOptionsById(courtId));

  const normalizedData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data
      .filter((entry) => !dayjs(entry.date).isBefore(dayjs(), 'day'))
      .map((entry) => ({
        ...entry,
        slots: [...(entry.slots || [])].sort((a, b) => dayjs(a.startAt).diff(dayjs(b.startAt)))
      }));
  }, [data]);

  const allSlots = useMemo(
    () => normalizedData.flatMap((entry) => entry.slots || []),
    [normalizedData]
  );

  const filteredData = normalizedData
    .filter(
      (entry) =>
        (!from || entry.date.slice(0, 10) >= from) && (!to || entry.date.slice(0, 10) <= to)
    )
    .map((entry) => ({
      ...entry,
      slots: entry.slots.filter(
        (slot) =>
          (!startTime || String(slot.startAt).slice(11, 16) >= startTime) &&
          (!endTime || String(slot.endAt).slice(11, 16) <= endTime)
      )
    }))
    .filter((entry) => entry.slots.length > 0);
  const visibleIds = filteredData.flatMap((entry) => entry.slots.map((slot) => slot.id));
  const selectedIds = visibleIds.filter((id) => selected.includes(id));
  const toggle = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id)
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 border p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Dari tanggal', type: 'date', value: from, setter: setFrom },
          { label: 'Sampai tanggal', type: 'date', value: to, setter: setTo },
          { label: 'Dari jam', type: 'time', value: startTime, setter: setStartTime },
          { label: 'Sampai jam', type: 'time', value: endTime, setter: setEndTime }
        ].map((field) => (
          <label key={field.label} className="space-y-2 text-sm">
            <span>{field.label}</span>
            {field.type === 'date' ? (
              <ReportDatePicker
                label={field.label}
                value={field.value}
                onChange={(value) => {
                  field.setter(value);
                  setSelected([]);
                }}
              />
            ) : (
              <Input
                type={field.type}
                value={field.value}
                onChange={(event) => {
                  field.setter(event.target.value);
                  setSelected([]);
                }}
              />
            )}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            disabled={!visibleIds.length || bulk.isPending}
            checked={
              selectedIds.length > 0 && selectedIds.length === visibleIds.length
                ? true
                : selectedIds.length > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(checked) => setSelected(checked === true ? visibleIds : [])}
          />
          Pilih semua hasil filter ({visibleIds.length} slot)
        </label>
        <span className="text-muted-foreground text-sm">{selectedIds.length} dipilih</span>
        <Button
          variant="destructive"
          disabled={!selectedIds.length || selectedIds.length > 5000 || bulk.isPending}
          onClick={() => setAction(false)}
        >
          Nonaktifkan slot
        </Button>
        <Button
          variant="outline"
          disabled={!selectedIds.length || selectedIds.length > 5000 || bulk.isPending}
          onClick={() => setAction(true)}
        >
          Aktifkan slot
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom('');
            setTo('');
            setStartTime('');
            setEndTime('');
            setSelected([]);
          }}
        >
          Reset filter
        </Button>
      </div>
      {selectedIds.length > 5000 && <p role="alert">Pilih maksimal 5.000 slot per proses.</p>}
      {result && (
        <p role="status" className="border p-3 text-sm">
          {result}
        </p>
      )}
      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open && !bulk.isPending) setAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action ? 'Aktifkan' : 'Nonaktifkan'} {selectedIds.length} slot?
            </DialogTitle>
            <DialogDescription>
              Perubahan berlaku pada lapangan ini. Slot dengan booking aktif akan dilewati. Harga
              tetap tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={bulk.isPending} onClick={() => setAction(null)}>
              Batal
            </Button>
            <Button
              disabled={bulk.isPending || !selectedIds.length}
              onClick={() => bulk.mutate({ ids: selectedIds, available: action === true })}
            >
              {bulk.isPending ? 'Memproses…' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        loading={isPending}
        data={filteredData}
        columns={columns}
        enableRowSelection={false}
        enableColumnVisibility={false}
        getSubRows={(row) => {
          // Only expand for top-level date rows, not for sub rows
          if (!('isSubRow' in row)) {
            if (Array.isArray(row.slots) && row.slots.length) {
              return [{ ...row, isSubRow: true }];
            }
          }

          return undefined;
        }}
        enableExpandAllRows
        renderSubRow={(row) => (
          <div className="-mt-5 mb-4 overflow-x-auto px-4">
            <DataTable<Slot>
              data={row.slots || []}
              enableGlobalSearch={false}
              enableColumnVisibility={false}
              enablePagination={false}
              enablePageSize={false}
              columns={[
                {
                  id: 'bulk-selection',
                  header: 'Pilih',
                  cell: ({ row }) => (
                    <Checkbox
                      aria-label={`Pilih slot ${formatSlotTimeRange(row.original.startAt, row.original.endAt)}`}
                      disabled={bulk.isPending}
                      checked={selected.includes(row.original.id)}
                      onCheckedChange={(checked) => toggle(row.original.id, checked === true)}
                    />
                  )
                },
                {
                  accessorKey: 'startAt',
                  header: 'Waktu Mulai',
                  cell: ({ row, getValue }) => {
                    const slot = row.original as Slot;
                    return formatSlotTimeRange(getValue(), slot.endAt);
                  }
                },
                {
                  accessorKey: 'isAvailable',
                  header: 'Status',
                  cell: (info) => {
                    const isAvailable = info.getValue() as boolean;
                    return (
                      <Badge variant={isAvailable ? 'lightSuccess' : 'lightDestructive'}>
                        {isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                      </Badge>
                    );
                  }
                },
                {
                  accessorKey: 'price',
                  header: 'Harga (IDR)',
                  cell: (info) => {
                    const slot = info.row.original as Slot;
                    const normalPrice = slot.price || 0;
                    const discountPrice = slot.discountPrice || 0;
                    const formattedNormal = normalPrice.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    });
                    const formattedDiscount = discountPrice.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    });

                    if (discountPrice > 0 && discountPrice < normalPrice) {
                      return (
                        <div className="flex flex-col text-xs">
                          <span className="text-muted-foreground line-through">
                            {formattedNormal}
                          </span>
                          <span className="font-semibold text-green-700">{formattedDiscount}</span>
                        </div>
                      );
                    }

                    return formattedNormal;
                  }
                },
                {
                  id: 'actions',
                  header: 'Aksi',
                  cell: (info) => {
                    const slot = info.row.original as Slot;
                    const dialogId = `toggle-slot-${slot.id}`;
                    const dialogEditId = `edit-slot-${slot.id}`;
                    return (
                      <div className="flex justify-end gap-2">
                        <ManagedDialog id={dialogEditId}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="lightInfo">
                              <IconPencil />
                            </Button>
                          </DialogTrigger>
                          <EditSlotModal slot={slot} courtId={courtId} dialogId={dialogEditId} />
                        </ManagedDialog>
                        <ManagedDialog id={dialogId}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="lightInfo">
                              <IconPower />
                            </Button>
                          </DialogTrigger>
                          <ToggleSlotModal slot={slot} courtId={courtId} dialogId={dialogId} />
                        </ManagedDialog>
                      </div>
                    );
                  }
                }
              ]}
              enableRowSelection={false}
            />
          </div>
        )}
        addButton={
          <div className="flex gap-2">
            <ManagedDialog id="bulk-edit-court-costing">
              <DialogTrigger asChild>
                <Button variant="outline" disabled={allSlots.length === 0}>
                  <IconEdit />
                  Bulk Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Edit Costing</DialogTitle>
                  <DialogDescription>
                    Ubah harga beberapa slot berdasarkan rentang tanggal, hari, dan jam.
                  </DialogDescription>
                </DialogHeader>
                <BulkEditCourtCostForm
                  courtId={courtId}
                  slots={allSlots}
                  dialogId="bulk-edit-court-costing"
                />
              </DialogContent>
            </ManagedDialog>

            <ManagedDialog id="create-court-costing">
              <DialogTrigger asChild>
                <Button>
                  <IconPlus />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent className="lg:min-w-xl">
                <DialogHeader className="mb-4">
                  <DialogTitle>Buat Cost Lapangan</DialogTitle>
                </DialogHeader>
                <CreateCourtCostForm courtId={courtId} />
              </DialogContent>
            </ManagedDialog>
          </div>
        }
      />
    </div>
  );
};
export default CourtCostingTable;
