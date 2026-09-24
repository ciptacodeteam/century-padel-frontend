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
  membershipData?: { activeMembership: ActiveMembership | null } | null,
  isUser: boolean = false,
  useMembership: boolean = false
): MembershipDiscountResult {
  // Fetch membership for current user if isUser is true
  const { data: userMembershipData } = useQuery({
    ...myMembershipQueryOptions,
    enabled: isUser && !membershipData
  });

  // Fetch membership for customer (admin context) if customerId is provided
  const { data: adminMembershipData } = useQuery({
    ...adminCustomerMembershipQueryOptions(customerId || ''),
    enabled: !isUser && !!customerId && !membershipData
  });

  // Use provided membership data, user membership data, or admin membership data
  const activeMembershipData = membershipData || userMembershipData || adminMembershipData;

  return useMemo(() => {
    const activeMembership = activeMembershipData?.activeMembership ?? null;
    const remainingSessions = activeMembership?.remainingSessions ?? 0;
    const hasActiveMembership =
      activeMembership &&
      !activeMembership.isExpired &&
      !activeMembership.isSuspended &&
      remainingSessions > 0;

    const membershipType = activeMembership?.membership.type ?? 'ALL_HOUR';
    let allocatedHours = 0;
    const coveredBookingKeys: string[] = [];
    const sortedBookings = [...bookingItems].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.timeSlot.localeCompare(b.timeSlot);
    });

    for (const booking of sortedBookings) {
      const startTime = booking.timeSlot.split(' - ')[0]?.trim() ?? '';
      if (!isMembershipEligibleForStartTime(membershipType, startTime)) continue;

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
      if (allocatedHours + bookingHours > remainingSessions) continue;
      allocatedHours += bookingHours;
      coveredBookingKeys.push(getMembershipBookingKey(booking));
    }

    const isEligibleForSelectedHours = coveredBookingKeys.length > 0;
    const canUseMembership =
      useMembership &&
      !!hasActiveMembership &&
      bookingItems.length > 0 &&
      isEligibleForSelectedHours;

    let ineligibilityReason: string | null = null;
    if (useMembership && !hasActiveMembership) {
      ineligibilityReason = 'Membership tidak aktif atau tidak memiliki sisa jam.';
    } else if (useMembership && !isEligibleForSelectedHours) {
      ineligibilityReason = 'Tidak ada slot yang dapat ditanggung oleh membership ini.';
    }
    // Calculate original total
    const originalTotal = bookingItems.reduce((sum, booking) => {
      const discountPrice = booking.discountPrice ?? 0;
      const effectivePrice = discountPrice > 0 ? discountPrice : booking.price;
      return sum + effectivePrice;
    }, 0);

    // Calculate discount amount
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

    const discountedTotal = originalTotal - discountAmount;

    return {
      activeMembership,
      canUseMembership: !!canUseMembership,
      remainingSessions,
      hoursToDeduct: canUseMembership ? allocatedHours : 0,
      slotsToDeduct: canUseMembership ? coveredBookingKeys.length : 0,
      discountAmount,
      originalTotal,
      discountedTotal,
      isEligibleForSelectedHours,
      ineligibilityReason,
      coveredBookingKeys: canUseMembership ? coveredBookingKeys : []
    };
  }, [activeMembershipData, bookingItems, useMembership]);
}
