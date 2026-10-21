import { toLocalSlotDate } from './time-utils';

export type MembershipBenefitDetail = {
  price: number;
  membershipUserId?: string | null;
  complimentaryMembershipHours?: number;
  cancelledAt?: string | Date | null;
  slot?: { startAt?: string | Date; endAt?: string | Date };
  membershipUser?: {
    membership?: { name: string; type?: string; price?: number; sessions?: number } | null;
    invoice?: { subtotal: number; promoDiscountAmount?: number; status: string } | null;
  } | null;
};

export function getMembershipBookingBenefits(details: MembershipBenefitDetail[]) {
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      type?: string;
      hours: number;
      complimentaryHours: number;
      regularPrice: number;
      hourlyRate: number | null;
    }
  >();

  for (const detail of details) {
    if (!detail.membershipUserId || detail.cancelledAt) continue;
    const start = toLocalSlotDate(detail.slot?.startAt);
    const end = toLocalSlotDate(detail.slot?.endAt);
    if (!start || !end || end <= start) continue;
    const membership = detail.membershipUser?.membership;
    const purchase = detail.membershipUser?.invoice;
    // Keep this informational estimate separate from the booking's payment amounts.
    const packagePrice =
      purchase?.status === 'PAID'
        ? Math.max(0, purchase.subtotal - (purchase.promoDiscountAmount || 0))
        : membership?.price;
    const sessions = membership?.sessions;
    const hourlyRate =
      typeof packagePrice === 'number' &&
      Number.isFinite(packagePrice) &&
      packagePrice >= 0 &&
      typeof sessions === 'number' &&
      Number.isFinite(sessions) &&
      sessions > 0
        ? packagePrice / sessions
        : null;
    const group = groups.get(detail.membershipUserId) || {
      id: detail.membershipUserId,
      name: membership?.name || 'Membership',
      type: membership?.type,
      hours: 0,
      complimentaryHours: 0,
      regularPrice: 0,
      hourlyRate
    };
    // Match membership debit rules: every partial slot consumes a whole package hour.
    group.hours += Math.ceil((end.getTime() - start.getTime()) / 3_600_000);
    group.complimentaryHours += Math.min(
      Math.ceil((end.getTime() - start.getTime()) / 3_600_000),
      Math.max(0, detail.complimentaryMembershipHours ?? 0)
    );
    group.regularPrice += Math.max(0, detail.price);
    groups.set(group.id, group);
  }

  return Array.from(groups.values()).map((group) => {
    const usageValue =
      group.hourlyRate === null
        ? null
        : Math.round((group.hours - group.complimentaryHours) * group.hourlyRate);
    return {
      ...group,
      usageValue,
      savings: usageValue === null ? null : Math.max(0, group.regularPrice - usageValue)
    };
  });
}
