import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@/stores/useAuthStore';
import MyMembershipPage from './page';

const { getProfile, getMemberships } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getMemberships: vi.fn()
}));
vi.mock('@/api/auth', () => ({ getProfileApiSmart: getProfile }));
vi.mock('@/api/membership', () => ({ getMyMembershipsApi: getMemberships }));
vi.mock('@/components/headers/MainHeader', () => ({ default: () => null }));
vi.mock('@/components/footers/MainBottomNavigation', () => ({ default: () => null }));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useAuthStore.setState({ isAuth: false, token: null, user: null });
});

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MyMembershipPage />
    </QueryClientProvider>
  );
  return client;
}

describe('membership customer page session and history', () => {
  it('loads using the authenticated profile when login persisted only a token', async () => {
    useAuthStore.setState({ isAuth: true, token: 'test-token', user: null });
    getProfile.mockResolvedValue({ data: { id: 'customer-1' } });
    getMemberships.mockResolvedValue({
      data: {
        active: [],
        expired: [{ id: 'old-package' }],
        suspended: [],
        total: 1,
        activity: { memberships: [], events: [] }
      }
    });
    const client = show();
    expect(await screen.findByText('Riwayat Jam')).toBeInTheDocument();
    expect(getMemberships).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(['memberships', 'my', 'history', 'customer-1'])).toBeDefined();
  });

  it('offers login without requesting private data for a signed out visitor', () => {
    useAuthStore.setState({ isAuth: false, token: null, user: null });
    show();
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
    expect(getMemberships).not.toHaveBeenCalled();
    expect(getProfile).not.toHaveBeenCalled();
  });
});
