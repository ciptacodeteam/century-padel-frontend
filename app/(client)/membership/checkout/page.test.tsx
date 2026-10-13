import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MembershipCheckoutPage from './page';

const { checkout, getMembership, getPaymentMethods, getProfile, replace, push, openAuth } =
  vi.hoisted(() => ({
    checkout: vi.fn(),
    getMembership: vi.fn(),
    getPaymentMethods: vi.fn(),
    getProfile: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
    openAuth: vi.fn()
  }));
const router = { replace, push };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/api/membership', () => ({
  getMembershipApi: getMembership,
  getMyMembershipsApi: vi.fn(),
  getMyMembershipApi: vi.fn(),
  getMembershipsApi: vi.fn(),
  doMembershipCheckoutApi: checkout
}));
vi.mock('@/api/paymentMethod', () => ({ getPaymentMethodsApi: getPaymentMethods }));
vi.mock('@/api/auth', () => ({ getProfileApiSmart: getProfile }));
vi.mock('@/stores/useAuthModalStore', () => ({ default: () => openAuth }));

const membership = {
  id: 'membership-100',
  name: '100-HOUR HAPPY PACKAGE',
  price: 17000000,
  sessions: 100,
  duration: 180,
  benefits: []
};
const qris = { id: 'qris', name: 'QRIS', logo: null, fees: 0, percentage: 0 };

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return render(
    <QueryClientProvider client={client}>
      <MembershipCheckoutPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('membershipCheckoutId', membership.id);
  getMembership.mockResolvedValue({ data: membership });
  getPaymentMethods.mockResolvedValue({ data: [qris] });
  getProfile.mockResolvedValue({ data: { id: 'member-1' } });
  checkout.mockResolvedValue({ data: { invoiceNumber: 'INV-MEMBER-1' } });
});
afterEach(cleanup);

describe('membership checkout payment action', () => {
  it.each([375, 1440])(
    'shows a payment action in the summary at width %i and opens payment instructions',
    async (width) => {
      window.innerWidth = width;
      mount();
      const button = await screen.findByRole('button', { name: 'Bayar Sekarang' });
      expect(button).toBeVisible();
      // The action must remain in the page content, outside mobile-only footer containers.
      expect(button.closest('main')).not.toBeNull();
      expect(button.closest('[class*="lg:hidden"]')).toBeNull();
      fireEvent.click(button);
      await waitFor(() =>
        expect(checkout.mock.calls[0]?.[0]).toEqual({
          membershipId: membership.id,
          paymentMethodId: qris.id
        })
      );
      await waitFor(() => expect(replace).toHaveBeenCalledWith('/invoice/INV-MEMBER-1'));
      expect(sessionStorage.getItem('membershipCheckoutId')).toBeNull();
    }
  );

  it('opens method selection when no payment method is available', async () => {
    getPaymentMethods.mockResolvedValue({ data: [] });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Pilih Metode' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Pilih Metode Pembayaran');
    expect(checkout).not.toHaveBeenCalled();
  });

  it('disables the action while checkout is pending', async () => {
    checkout.mockImplementation(() => new Promise(() => {}));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Bayar Sekarang' }));
    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled();
    expect(checkout).toHaveBeenCalledTimes(1);
  });

  it('opens login instead of submitting for a guest', async () => {
    getProfile.mockResolvedValue({ data: null });
    mount();
    const button = await screen.findByRole('button', { name: 'Login untuk Checkout' });
    openAuth.mockClear();
    fireEvent.click(button);
    expect(openAuth).toHaveBeenCalledOnce();
    expect(checkout).not.toHaveBeenCalled();
  });
});
