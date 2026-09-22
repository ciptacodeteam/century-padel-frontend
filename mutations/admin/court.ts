import {
  bulkUpdateSlotPriceApi,
  createCourtApi,
  createCourtCostApi,
  updateCourtApi,
  updateCourtCostApi,
  updateSlotAvailabilityApi,
  updateSlotPriceApi
} from '@/api/admin/court';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreateCourtMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createCourtApi,
    onSuccess: (data) => {
      toast.success('Data berhasil disimpan!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal menyimpan data. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdateCourtMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateCourtApi,
    onSuccess: (data) => {
      toast.success('Data berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui data. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminCreateCourtCostMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createCourtCostApi,
    onSuccess: (data) => {
      toast.success('Data berhasil disimpan!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal menyimpan data. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdateCourtCostMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateCourtCostApi,
    onSuccess: (data) => {
      toast.success('Data berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui data. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdateSlotAvailabilityMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({ slotId, isAvailable }: { slotId: string; isAvailable: boolean }) =>
      updateSlotAvailabilityApi(slotId, isAvailable),
    onSuccess: (data) => {
      toast.success('Status slot berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui status slot. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdateSlotPriceMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({
      slotId,
      price,
      discountPrice
    }: {
      slotId: string;
      price: number;
      discountPrice: number;
    }) => updateSlotPriceApi(slotId, { price, discountPrice }),
    onSuccess: (data) => {
      toast.success('Harga slot berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui harga slot. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminBulkUpdateSlotPriceMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({
      courtId,
      slotIds,
      price,
      discountPrice
    }: {
      courtId: string;
      slotIds: string[];
      price: number;
      discountPrice: number;
    }) => bulkUpdateSlotPriceApi(courtId, { slotIds, price, discountPrice }),
    onSuccess: (data) => {
      const updatedCount = data?.data?.updatedCount ?? slotCountFromResponse(data);
      const skippedCount = data?.data?.skippedCount ?? 0;
      toast.success(
        `${updatedCount} harga slot berhasil diperbarui${
          skippedCount > 0 ? `, ${skippedCount} slot terbooking dilewati` : ''
        }.`
      );
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui harga slot secara bulk. Silakan coba lagi.');
      onError?.(error);
    }
  });

function slotCountFromResponse(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const value = (data as { updatedCount?: unknown }).updatedCount;
  return typeof value === 'number' ? value : 0;
}
