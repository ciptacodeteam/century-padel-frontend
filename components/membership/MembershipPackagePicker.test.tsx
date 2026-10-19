import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import MembershipPackagePicker from './MembershipPackagePicker';
import type { MembershipActivitySummary } from '@/types/membership-activity';

const { mobile } = vi.hoisted(() => ({ mobile: vi.fn() }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: mobile }));
const memberships: MembershipActivitySummary[] = [
  {
    id: 'membership-first123',
    name: '100-HOUR HAPPY PACKAGE',
    createdAt: '2026-10-17T10:00:00Z',
    endDate: '2026-11-17T10:00:00Z',
    allocatedHours: 100,
    remainingHours: 80,
    bookingHours: 20,
    heldHours: 0,
    transferredOutHours: 0,
    transferredInHours: 0,
    untrackedHours: 0,
    status: 'ACTIVE'
  },
  {
    id: 'membership-second456',
    name: '100-HOUR HAPPY PACKAGE',
    createdAt: '2026-09-17T10:00:00Z',
    endDate: '2026-10-17T10:00:00Z',
    allocatedHours: 100,
    remainingHours: 0,
    bookingHours: 100,
    heldHours: 0,
    transferredOutHours: 0,
    transferredInHours: 0,
    untrackedHours: 0,
    status: 'EXPIRED'
  }
];

afterEach(cleanup);
beforeEach(() => {
  mobile.mockReturnValue(false);
});

function openPicker() {
  fireEvent.click(screen.getByRole('button', { name: 'Filter paket membership' }));
  return within(screen.getByRole('dialog', { name: 'Pilih Membership' }));
}

describe('responsive membership package picker', () => {
  it('shows a short trigger and selects the exact package among duplicate names', () => {
    const change = vi.fn();
    render(
      <MembershipPackagePicker
        memberships={memberships}
        value={memberships[0].id}
        onValueChange={change}
      />
    );
    expect(screen.getByRole('button', { name: 'Filter paket membership' })).toHaveTextContent(
      '100-HOUR HAPPY PACKAGE'
    );
    expect(screen.queryByText(/17 Okt 2026/)).not.toBeInTheDocument();
    const picker = openPicker();
    expect(picker.getByText('Aktif')).toBeInTheDocument();
    expect(picker.getByText('Berakhir')).toBeInTheDocument();
    fireEvent.click(picker.getByRole('button', { name: /17 Sep 2026/ }));
    expect(change).toHaveBeenCalledWith('membership-second456');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches by package ID and allows resetting to all packages', () => {
    const change = vi.fn();
    render(
      <MembershipPackagePicker
        memberships={memberships}
        value={memberships[0].id}
        onValueChange={change}
      />
    );
    const picker = openPicker();
    fireEvent.change(picker.getByRole('textbox', { name: 'Cari membership' }), {
      target: { value: 'ond456' }
    });
    expect(picker.queryByText(/17 Okt 2026/)).not.toBeInTheDocument();
    expect(picker.getByText(/17 Sep 2026/)).toBeInTheDocument();
    fireEvent.click(picker.getByRole('button', { name: 'Semua membership' }));
    expect(change).toHaveBeenCalledWith('ALL');
  });

  it('provides a labelled mobile sheet and clears search when reopened', () => {
    mobile.mockReturnValue(true);
    render(
      <MembershipPackagePicker memberships={memberships} value="ALL" onValueChange={vi.fn()} />
    );
    const picker = openPicker();
    expect(picker.getByText('Pilih paket untuk melihat riwayat jamnya.')).toBeInTheDocument();
    fireEvent.change(picker.getByRole('textbox', { name: 'Cari membership' }), {
      target: { value: 'missing' }
    });
    expect(picker.getByRole('status')).toHaveTextContent('Membership tidak ditemukan');
    fireEvent.click(picker.getByRole('button', { name: 'Close' }));
    const reopened = openPicker();
    expect(reopened.getByRole('textbox', { name: 'Cari membership' })).toHaveValue('');
    expect(reopened.getAllByText('100-HOUR HAPPY PACKAGE')).toHaveLength(2);
  });
});
