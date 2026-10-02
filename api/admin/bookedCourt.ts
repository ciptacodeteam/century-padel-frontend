import { adminApi } from '@/lib/adminApi';

export async function rescheduleBookedCourtApi(id: string, slotId: string) {
  const { data } = await adminApi.put(`/booked-courts/${id}/reschedule`, { newSlotId: slotId });
  return data;
}

export async function cancelBookedCourtApi(
  id: string,
  payload: { reason: string; refundAmount: number }
) {
  const { data } = await adminApi.put(`/booked-courts/${id}/cancel`, payload);
  return data;
}
