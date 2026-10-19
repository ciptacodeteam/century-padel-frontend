import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import MembershipActivitySection from './MembershipActivity';
import type { MembershipActivity } from '@/types/membership-activity';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

afterEach(cleanup);
const activity: MembershipActivity = {
  memberships: [
    {
      id: 'package-expired',
      name: 'Membership 20 Jam',
      createdAt: '2026-10-01T10:00:00Z',
      endDate: '2026-10-15T10:00:00Z',
      allocatedHours: 20,
      remainingHours: 0,
      bookingHours: 16,
      heldHours: 0,
      transferredOutHours: 4,
      transferredInHours: 0,
      untrackedHours: 0,
      status: 'EXPIRED'
    }
  ],
  events: [
    {
      id: 'transfer',
      membershipUserId: 'package-expired',
      type: 'TRANSFER_OUT',
      title: 'Transfer ke Budi',
      hours: -4,
      occurredAt: '2026-10-05T10:00:00Z',
      reference: 'transfer-reference',
      counterpart: 'Budi',
      status: 'COMPLETED'
    },
    {
      id: 'booking',
      membershipUserId: 'package-expired',
      type: 'BOOKING',
      title: 'Booking Court 1',
      hours: -2,
      occurredAt: '2026-10-03T10:00:00Z',
      reference: 'INV-BOOKING',
      court: 'Court 1',
      startAt: '2026-10-04T10:00:00Z',
      endAt: '2026-10-04T12:00:00Z',
      status: 'COMPLETED'
    },
    {
      id: 'return',
      membershipUserId: 'package-expired',
      type: 'RETURN',
      title: 'Pengembalian transfer yang dibatalkan',
      hours: 1,
      occurredAt: '2026-10-02T10:00:00Z',
      reference: 'cancelled-transfer',
      counterpart: 'Andi',
      status: 'COMPLETED'
    }
  ]
};

describe('membership hour history', () => {
  it('filters usage and transfers including transfer reversals from expired packages', () => {
    render(<MembershipActivitySection activity={activity} />);
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    expect(screen.getByText('Transfer ke Budi')).toBeInTheDocument();
    expect(screen.getByText('Pengembalian transfer yang dibatalkan')).toBeInTheDocument();
    expect(screen.queryByText('Booking Court 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pemakaian' }));
    expect(screen.getByText('Booking Court 1')).toBeInTheDocument();
    expect(screen.queryByText('Transfer ke Budi')).not.toBeInTheDocument();
  });

  it('opens the exact transfer reference, recipient, package and amount in an accessible dialog', () => {
    render(<MembershipActivitySection activity={activity} />);
    fireEvent.click(screen.getByRole('button', { name: /Transfer ke Budi/ }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Budi', { exact: true })).toBeInTheDocument();
    expect(dialog.getByText('transfer-reference')).toBeInTheDocument();
    expect(dialog.getByText('package-expired')).toBeInTheDocument();
    expect(dialog.getByText('−4')).toBeInTheDocument();
  });

  it('preserves the stored court wall-clock schedule in booking details', () => {
    render(<MembershipActivitySection activity={activity} />);
    fireEvent.click(screen.getByRole('button', { name: /Booking Court 1/ }));
    expect(within(screen.getByRole('dialog')).getByText(/10:00–12:00 WIB/)).toBeInTheDocument();
  });

  it('shows one invoice debit and preserves every court schedule in its detail', () => {
    const original = activity.events[1];
    render(
      <MembershipActivitySection
        activity={{
          ...activity,
          events: [
            original,
            {
              ...original,
              id: 'booking-2',
              court: 'Court 2',
              title: 'Booking Court 2',
              hours: -3,
              startAt: '2026-10-04T13:00:00Z',
              endAt: '2026-10-04T16:00:00Z'
            }
          ]
        }}
      />
    );
    expect(screen.getByText('1 aktivitas')).toBeInTheDocument();
    expect(screen.getByText('−5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Booking lapangan/ }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('INV-BOOKING')).toBeInTheDocument();
    expect(dialog.getByText('Court 1')).toBeInTheDocument();
    expect(dialog.getByText('Court 2')).toBeInTheDocument();
    expect(dialog.getByText(/10:00–12:00 WIB/)).toBeInTheDocument();
    expect(dialog.getByText(/13:00–16:00 WIB/)).toBeInTheDocument();
  });

  it('shows an empty state when no activity matches', () => {
    render(<MembershipActivitySection activity={{ ...activity, events: [activity.events[1]] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Belum ada aktivitas transfer');
  });

  it('limits initial rows and loads older history on request', () => {
    const events = Array.from({ length: 12 }, (_, index) => ({
      ...activity.events[0],
      id: `transfer-${index}`,
      title: `Transfer ke Member ${index}`
    }));
    render(<MembershipActivitySection activity={{ ...activity, events }} />);
    expect(screen.queryByText('Transfer ke Member 10')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan lebih banyak' }));
    expect(screen.getByText('Transfer ke Member 11')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Tampilkan lebih banyak' })
    ).not.toBeInTheDocument();
  });
});
