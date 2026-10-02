import {
  getMembershipsApi,
  getMembershipApi,
  getMyMembershipsApi,
  getMyMembershipApi
} from '@/api/membership';
import type { Membership, MembershipType } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';

export const membershipsQueryOptions = () =>
  queryOptions({
    queryKey: ['memberships'],
    queryFn: getMembershipsApi,
    select: (res) => res.data as Membership[]
  });

export const membershipQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['memberships', id],
    queryFn: () => getMembershipApi(id),
    select: (res) => res.data as Membership
  });

export const myMembershipsQueryOptions = queryOptions({
  queryKey: ['memberships', 'my'],
  queryFn: getMyMembershipsApi,
  select: (res) =>
    res.data as {
      active: Array<{
        id: string;
        userId: string;
        membershipId: string;
        startDate: string;
        endDate: string;
        remainingSessions: number;
        remainingDuration: number;
        isExpired: boolean;
        isSuspended: boolean;
        acquisitionType: 'PURCHASE' | 'TRANSFER';
        incomingTransfer?: {
          id: string;
          transferredHours: number;
          createdAt: string;
          fromUser: { name: string };
        } | null;
        membership: Membership;
      }>;
      expired: Array<any>;
      suspended: Array<any>;
      total: number;
    }
});

export type UserActiveMembership = {
  id: string;
  startDate: string;
  endDate: string;
  remainingSessions: number;
  remainingDuration: number;
  isExpired: boolean;
  isSuspended: boolean;
  acquisitionType: 'PURCHASE' | 'TRANSFER';
  transfer?: {
    id: string;
    transferredHours: number;
    createdAt: string;
    fromUser: { name: string };
  } | null;
  membership: {
    id: string;
    name: string;
    price: number;
    type: MembershipType;
    scheduleVisibilityMonths: number;
  };
};

export type UserMembershipResponse = {
  scheduleVisibilityMonths: number;
  activeMembership: UserActiveMembership | null;
  activeMemberships?: UserActiveMembership[];
};

export const myMembershipQueryOptions = (userId?: string | null) =>
  queryOptions({
    // Membership data is user-specific. Including the user id prevents data from
    // a previous login being reused for the next account in the same browser.
    queryKey: ['memberships', 'my', 'active', userId ?? 'anonymous'],
    queryFn: async () => {
      const res = await getMyMembershipApi();
      return res.data as UserMembershipResponse;
    },
    enabled: !!userId
  });
