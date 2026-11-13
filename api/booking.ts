import { api } from '@/lib/api';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { CreateMutationPayload, SearchParamsData } from '@/types';

export async function createBookingApi(payload: CreateMutationPayload) {
  const { data } = await api.post('/bookings', payload.data);
  return data;
}

export async function getBookingsApi(queryParams: SearchParamsData = {}) {
  const url = '/bookings';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function checkoutApi(payload: any) {
  const { data } = await api.post('/checkout', payload);
  return data;
}

export async function applyPromoApi(payload: any) {
  const { data } = await api.post('/checkout/apply-promo', payload);
  return data;
}

export async function getInvoiceApi(invoiceId: string, shareToken?: string | null) {
  const { data } = await api.get(`/invoices/${invoiceId}`, {
    params: shareToken ? { share: shareToken } : undefined
  });
  return data;
}

export async function getAllInvoicesApi(queryParams: SearchParamsData = {}) {
  const url = '/invoices';
  const mergedUrl = mergedQueryParamUrl(url, queryParams);
  const res = await api.get(mergedUrl);
  return res.data;
}

export async function expireInvoiceApi(invoiceId: string) {
  const { data } = await api.post(`/invoices/${invoiceId}/expire`);
  return data;
}

export async function mockPayInvoiceApi(invoiceId: string) {
  const { data } = await api.post(`/invoices/${invoiceId}/mock-pay`);
  return data;
}
