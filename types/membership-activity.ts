export type MembershipActivityEvent = {
  id: string;
  membershipUserId: string;
  type: 'PURCHASE' | 'BOOKING' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN';
  title: string;
  hours: number;
  occurredAt: string;
  reference: string;
  counterpart?: string;
  court?: string;
  startAt?: string;
  endAt?: string;
  status: 'COMPLETED' | 'HOLD' | 'CANCELLED';
};

export type MembershipActivitySummary = {
  id: string;
  name: string;
  createdAt: string;
  endDate: string;
  allocatedHours: number;
  remainingHours: number;
  bookingHours: number;
  heldHours: number;
  transferredOutHours: number;
  transferredInHours: number;
  untrackedHours: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED' | 'UPCOMING';
};

export type MembershipActivity = {
  memberships: MembershipActivitySummary[];
  events: MembershipActivityEvent[];
};
