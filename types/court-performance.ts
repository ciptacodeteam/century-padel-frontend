export type CourtPerformanceRow = {
  id: string;
  name: string;
  kind: string;
  packageHours: number | null;
  hours: number;
  elapsedHours: number;
  upcomingHours: number;
  normalValue: number;
  bookings: number;
  customers: number;
};
export type CourtPerformanceDetail = {
  id: string;
  groupId: string;
  category: string;
  bookingId: string;
  customer: string;
  court: string;
  startAt: string;
  endAt: string;
  bookedAt: string;
  band: string;
  hours: number;
  elapsedHours: number;
  upcomingHours: number;
  normalValue: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
};
export type CourtPerformance = {
  summary: {
    hours: number;
    elapsedHours: number;
    upcomingHours: number;
    availableHours: number;
    occupancy: number | null;
    elapsedOccupancy: number | null;
    membershipHours: number;
    regularHours: number;
  };
  rows: CourtPerformanceRow[];
  details: CourtPerformanceDetail[];
  courts: { id: string; name: string }[];
  period: { startDate: string; endDate: string };
  generatedAt: string;
};
