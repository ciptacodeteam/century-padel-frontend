import { useQuery } from '@tanstack/react-query';
import { adminCustomerMembershipQueryOptions } from '@/queries/admin/customer';
import { myMembershipQueryOptions } from '@/queries/membership';
import type { BookingItem } from '@/stores/useBookingStore';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  getMembershipBookingKey,
  isMembershipEligibleForStartTime
} from '@/lib/membership-eligibility';
import type { MembershipType } from '@/types/model';

export interface ActiveMembership {
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
    type: MembershipType;
    scheduleVisibilityMonths?: number;
  };
}

export interface MembershipDiscountResult {
  activeMembership: ActiveMembership | null;
  activeMemberships: ActiveMembership[];
  canUseMembership: boolean;
  remainingSessions: number;
  hoursToDeduct: number;
  slotsToDeduct: number;
  discountAmount: number;
  originalTotal: number;
  discountedTotal: number;
  isEligibleForSelectedHours: boolean;
  ineligibilityReason: string | null;
  coveredBookingKeys: string[];
  membershipAllocations: Array<{
    bookingKey: string;
    membershipUserId: string;
    hours: number;
  }>;
}

export function calculateMembershipDiscount(
  activeMembershipData:
    | {
        activeMembership: ActiveMembership | null;
        activeMemberships?: ActiveMembership[];
      }
    | null
    | undefined,
  bookingItems: BookingItem[],
  useMembership: boolean,
  selectedBookingKeys?: readonly string[],
  selectedMembershipByBookingKey?: Readonly<Record<string, string>>
): MembershipDiscountResult {
  const activeMemberships = (
    activeMembershipData?.activeMemberships?.length
      ? activeMembershipData.activeMemberships
      : activeMembershipData?.activeMembership
        ? [activeMembershipData.activeMembership]
        : []
  ).filter(
    (membership) =>
      !membership.isExpired && !membership.isSuspended && membership.remainingSessions > 0
  );
  const typePriority: Record<MembershipType, number> = {
    HAPPY_HOUR: 0,
    PEAK_HOUR: 1,
    ALL_HOUR: 2
  };
  const prioritizedMemberships = [...activeMemberships].sort((a, b) => {
    const typeComparison = typePriority[a.membership.type] - typePriority[b.membership.type];
    return typeComparison || dayjs(a.endDate).valueOf() - dayjs(b.endDate).valueOf();
  });
  const activeMembership = prioritizedMemberships[0] ?? null;
  const remainingSessions = activeMemberships.reduce(
    (total, membership) => total + membership.remainingSessions,
    0
  );
  const hasActiveMembership = activeMemberships.length > 0;
  let allocatedHours = 0;
  const coveredBookingKeys: string[] = [];
  const membershipAllocations: MembershipDiscountResult['membershipAllocations'] = [];
  const usedHoursByMembershipId = new Map<string, number>();
  const sortedBookings = [...bookingItems].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    return dateCompare !== 0 ? dateCompare : a.timeSlot.localeCompare(b.timeSlot);
  });

  const selectedKeySet = selectedBookingKeys ? new Set(selectedBookingKeys) : null;

  for (const booking of sortedBookings) {
    if (selectedKeySet && !selectedKeySet.has(getMembershipBookingKey(booking))) continue;
    const startTime = booking.timeSlot.split(' - ')[0]?.trim() ?? '';

    const [rangeStart, rangeEnd] = booking.timeSlot.split(' - ');
    const start = rangeStart?.trim();
    const end = (booking.endTime || rangeEnd)?.trim();
    let bookingHours = 1;
    if (start && end) {
      const startAt = dayjs(`2000-01-01 ${start}`);
      let endAt = dayjs(`2000-01-01 ${end}`);
      if (!endAt.isAfter(startAt)) endAt = endAt.add(1, 'day');
      bookingHours = Math.max(1, Math.ceil(endAt.diff(startAt, 'minute') / 60));
    }
    const bookingKey = getMembershipBookingKey(booking);
    const selectedMembershipId = selectedMembershipByBookingKey?.[bookingKey];
    if (selectedMembershipByBookingKey && !selectedMembershipId) continue;
    const membershipCandidates = selectedMembershipId
      ? prioritizedMemberships.filter((membership) => membership.id === selectedMembershipId)
      : prioritizedMemberships;
    const membershipToUse = membershipCandidates.find((membership) => {
      const usedHours = usedHoursByMembershipId.get(membership.id) ?? 0;
      return (
        isMembershipEligibleForStartTime(membership.membership.type, booking.date, startTime) &&
        usedHours + bookingHours <= membership.remainingSessions
      );
    });
    if (!membershipToUse) continue;

    allocatedHours += bookingHours;
    usedHoursByMembershipId.set(
      membershipToUse.id,
      (usedHoursByMembershipId.get(membershipToUse.id) ?? 0) + bookingHours
    );
    coveredBookingKeys.push(bookingKey);
    membershipAllocations.push({
      bookingKey,
      membershipUserId: membershipToUse.id,
      hours: bookingHours
    });
  }

  const isEligibleForSelectedHours = coveredBookingKeys.length > 0;
  const canUseMembership =
    useMembership && !!hasActiveMembership && bookingItems.length > 0 && isEligibleForSelectedHours;

  let ineligibilityReason: string | null = null;
  if (useMembership && !hasActiveMembership) {
    ineligibilityReason = 'Membership tidak aktif atau tidak memiliki sisa jam.';
  } else if (useMembership && !isEligibleForSelectedHours) {
    ineligibilityReason = 'Tidak ada slot yang dapat ditanggung oleh membership ini.';
  }

  const originalTotal = bookingItems.reduce((sum, booking) => {
    const discountPrice = booking.discountPrice ?? 0;
    const effectivePrice = discountPrice > 0 ? discountPrice : booking.price;
    return sum + effectivePrice;
  }, 0);

  let discountAmount = 0;
  if (canUseMembership && coveredBookingKeys.length > 0) {
    const coveredKeySet = new Set(coveredBookingKeys);
    const slotsToFree = bookingItems.filter((booking) =>
      coveredKeySet.has(getMembershipBookingKey(booking))
    );
    discountAmount = slotsToFree.reduce((sum, booking) => {
      const discountPrice = booking.discountPrice ?? 0;
      return sum + (discountPrice > 0 ? discountPrice : booking.price);
    }, 0);
  }

  return {
    activeMembership,
    activeMemberships: prioritizedMemberships,
    canUseMembership: !!canUseMembership,
    remainingSessions,
    hoursToDeduct: canUseMembership ? allocatedHours : 0,
    slotsToDeduct: canUseMembership ? coveredBookingKeys.length : 0,
    discountAmount,
    originalTotal,
    discountedTotal: originalTotal - discountAmount,
    isEligibleForSelectedHours,
    ineligibilityReason,
    coveredBookingKeys: canUseMembership ? coveredBookingKeys : [],
    membershipAllocations: canUseMembership ? membershipAllocations : []
  };
}

/**
 * Custom hook to calculate membership discount for court bookings
 * @param customerId - The customer ID to fetch membership for (optional if membershipData is provided or isUser is true)
 * @param bookingItems - Array of court booking items
 * @param membershipData - Optional membership data (if provided, will skip API call)
 * @param isUser - If true, fetches membership for current logged-in user instead of customerId
 * @returns Membership discount calculation result
 */
export function useMembershipDiscount(
  customerId: string | null,
  bookingItems: BookingItem[],
  membershipData?: {
    activeMembership: ActiveMembership | null;
    activeMemberships?: ActiveMembership[];
  } | null,
  isUser: boolean = false,
  useMembership: boolean = false,
  selectedBookingKeys?: readonly string[],
  selectedMembershipByBookingKey?: Readonly<Record<string, string>>
): MembershipDiscountResult {
  // Fetch membership for current user if isUser is true
  const { data: userMembershipData } = useQuery({
    ...myMembershipQueryOptions(customerId),
    enabled: isUser && !!customerId && !membershipData
  });

  // Fetch membership for customer (admin context) if customerId is provided
  const { data: adminMembershipData } = useQuery({
    ...adminCustomerMembershipQueryOptions(customerId || ''),
    enabled: !isUser && !!customerId && !membershipData
  });

  // Use provided membership data, user membership data, or admin membership data
  const activeMembershipData = membershipData || userMembershipData || adminMembershipData;

  return useMemo(
    () =>
      calculateMembershipDiscount(
        activeMembershipData,
        bookingItems,
        useMembership,
        selectedBookingKeys,
        selectedMembershipByBookingKey
      ),
    [
      activeMembershipData,
      bookingItems,
      selectedBookingKeys,
      selectedMembershipByBookingKey,
      useMembership
    ]
  );
}
