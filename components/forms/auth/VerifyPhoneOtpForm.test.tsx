import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePhoneStore } from '@/stores/usePhoneStore';

const mocks = vi.hoisted(() => ({ forgot: vi.fn(), registerOtp: vi.fn(), verify: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/queries/profile', () => ({ profileQueryOptions: { queryKey: ['profile'] } }));
vi.mock('@/mutations/auth', () => ({
  forgotPasswordMutationOptions: (options: object) => ({ mutationFn: mocks.forgot, ...options }),
  registerMutationOptions: (options: object) => ({ mutationFn: vi.fn(), ...options }),
  verifyPhoneOtpMutationOptions: (options: object) => ({ mutationFn: mocks.verify, ...options })
}));
vi.mock('@/mutations/phone', () => ({
  sendPhoneOtpMutationOptions: (options: object) => ({ mutationFn: mocks.registerOtp, ...options })
}));
vi.mock('@/components/buttons/ResendOtpButton', () => ({
  ResendOtpButton: ({ onSendOtp }: { onSendOtp: () => void }) => (
    <button type="button" onClick={onSendOtp}>
      Kirim ulang
    </button>
  )
}));
import VerifyPhoneOtpForm from './VerifyPhoneOtpForm';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  usePhoneStore.setState({ phone: '+6281234567890', requestId: 'old-request' });
  mocks.forgot.mockResolvedValue({ data: { requestId: 'new-recovery-request' } });
  mocks.registerOtp.mockResolvedValue({ data: { requestId: 'new-register-request' } });
});

function mount(type: 'global' | 'register') {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <VerifyPhoneOtpForm type={type} />
    </QueryClientProvider>
  );
}

describe('OTP resend purpose', () => {
  it('preserves password recovery purpose and replaces the request ID on resend', async () => {
    mount('global');
    fireEvent.click(screen.getByRole('button', { name: 'Kirim ulang' }));
    await waitFor(() => expect(usePhoneStore.getState().requestId).toBe('new-recovery-request'));
    expect(mocks.forgot).toHaveBeenCalled();
    expect(mocks.registerOtp).not.toHaveBeenCalled();
  });
  it('continues using registration OTP for a new registration', async () => {
    mount('register');
    fireEvent.click(screen.getByRole('button', { name: 'Kirim ulang' }));
    await waitFor(() => expect(usePhoneStore.getState().requestId).toBe('new-register-request'));
    expect(mocks.registerOtp).toHaveBeenCalled();
    expect(mocks.forgot).not.toHaveBeenCalled();
  });
});
