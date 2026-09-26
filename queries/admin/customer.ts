import {
  getCustomerApi,
  getCustomerMembershipApi,
  getCustomersApi,
  searchCustomersApi,
  getCustomerComplimentaryCreditsApi
} from '@/api/admin/customer';
import type { Customer } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const adminCustomersQueryOptions = queryOptions({
  queryKey: ['admin', 'customers'],
  queryFn: getCustomersApi,
  select: (res) => res.data as Customer[]
});

export const adminCustomerQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'customers', id],
    queryFn: () => getCustomerApi(id),
    select: (res) => res.data as Customer
  });

export type CustomerMembershipResponse = {
  customer: string;
  activeMembership: {
    id: string;
    startDate: string;
    endDate: string;
    remainingSessions: number;
    remainingDuration: number;
    isExpired: boolean;
    isSuspended: boolean;
    membership: {
      id: string;
      name: string;
      price: number;
      type: import('@/types/model').MembershipType;
    };
  } | null;
};

export const adminCustomerMembershipQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'customers', id, 'membership'],
    queryFn: () => getCustomerMembershipApi(id),
    select: (res) => res.data as CustomerMembershipResponse,
    enabled: !!id
  });

export type CustomerComplimentaryCreditsResponse = {
  user: { id: string; name: string; phone: string };
  totalMinutes: number;
  credits: Array<{
    id: string;
    purpose: 'TRIAL' | 'COACHING' | 'GOODWILL' | 'OTHER';
    grantedMinutes: number;
    remainingMinutes: number;
    expiresAt: string | null;
    note: string | null;
    isActive: boolean;
    createdAt: string;
    grantedBy: { id: string; name: string };
  }>;
  transactions: Array<{
    id: string;
    type: 'GRANT' | 'REDEEM' | 'REFUND' | 'REVOKE';
    minutes: number;
    note: string | null;
    createdAt: string;
    booking: { id: string; status: string } | null;
    staff: { id: string; name: string } | null;
  }>;
};

export const adminCustomerComplimentaryCreditsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'customers', id, 'complimentary-credits'],
    queryFn: () => getCustomerComplimentaryCreditsApi(id),
    select: (res) => res.data as CustomerComplimentaryCreditsResponse,
    enabled: !!id
  });

export type CustomerSearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string;
  activeMembership: {
    id: string;
    startDate: string;
    endDate: string;
    remainingSessions: number;
    remainingDuration: number;
    isExpired: boolean;
    isSuspended: boolean;
    membership: {
      id: string;
      name: string;
      price: number;
      type: import('@/types/model').MembershipType;
    };
  } | null;
};

export const adminCustomerSearchQueryOptions = (params: { q: string; limit?: string }) =>
  queryOptions({
    queryKey: ['admin', 'customers', 'search', params.q, params.limit],
    queryFn: () => searchCustomersApi(params),
    select: (res) => res.data as CustomerSearchResult[],
    enabled: params.q.length >= 2
  });
