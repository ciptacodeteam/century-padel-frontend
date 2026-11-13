import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import InvoiceHistoryPage from './page';

const mocks = vi.hoisted(() => ({ push: vi.fn(), status: 'PENDING' }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/footers/MainBottomNavigation', () => ({ default: () => null }));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: { queryKey: ['profile'] } }));
vi.mock('@/queries/invoice', () => ({
  invoicesQueryOptions: () => ({ queryKey: ['invoices'] })
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    isPending: false,
    isError: false,
    data:
      queryKey[0] === 'profile'
        ? { id: 'customer-1' }
        : {
            data: [
              {
                id: 'invoice-1',
                number: 'INV-1',
                status: mocks.status,
                total: 350000,
                issuedAt: '2026-11-13T10:00:00',
                dueDate: '2099-11-13T10:15:00',
                booking: { details: [], courtNormalPrice: 350000 }
              }
            ]
          }
  })
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('customer invoice history actions', () => {
  it.each(['PENDING', 'PAID'])('has no cancellation action for %s bookings', (status) => {
    mocks.status = status;
    render(<InvoiceHistoryPage />);
    expect(screen.queryByRole('button', { name: /batalkan|cancel/i })).not.toBeInTheDocument();
    const action = screen.getByRole('button', { name: status === 'PENDING' ? 'Bayar' : /detail/i });
    fireEvent.click(action);
    expect(mocks.push).toHaveBeenCalledWith('/invoice/INV-1');
  });
});
