import { getAllInvoicesApi, getInvoiceApi } from '@/api/booking';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const invoiceQueryOptions = (invoiceId: string, shareToken?: string | null) =>
  queryOptions({
    queryKey: ['invoice', invoiceId, shareToken],
    queryFn: () => getInvoiceApi(invoiceId, shareToken),
    enabled: !!invoiceId
  });

export const invoicesQueryOptions = (queryParams: SearchParamsData = {}) =>
  queryOptions({
    queryKey: ['invoices', queryParams],
    queryFn: () => getAllInvoicesApi(queryParams)
  });
