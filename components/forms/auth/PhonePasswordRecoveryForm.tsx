'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordMutationOptions } from '@/mutations/auth';
import { usePhoneStore } from '@/stores/usePhoneStore';
import VerifyPhoneOtpForm from './VerifyPhoneOtpForm';
import ResetPasswordForm from './ResetPasswordForm';

export default function PhonePasswordRecoveryForm({ initialPhone }: { initialPhone: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [step, setStep] = useState<'phone' | 'otp' | 'password' | 'done'>('phone');
  const setStoredPhone = usePhoneStore((state) => state.setPhone);
  const setRequestId = usePhoneStore((state) => state.setRequestId);
  const { mutate, isPending } = useMutation(
    forgotPasswordMutationOptions({
      onSuccess: (response) => {
        if (!response.data?.phone || !response.data?.requestId) return;
        setStoredPhone(response.data.phone);
        setRequestId(response.data.requestId);
        setStep('otp');
      }
    })
  );

  if (step === 'otp')
    return (
      <>
        <VerifyPhoneOtpForm onVerifySuccess={() => setStep('password')} />
        <Button
          variant="ghost"
          onClick={() => {
            setStoredPhone(null);
            setRequestId(null);
            setStep('phone');
          }}
        >
          Ganti nomor / mulai ulang
        </Button>
      </>
    );

  if (step === 'password')
    return (
      <ResetPasswordForm
        onSuccess={() => {
          setStoredPhone(null);
          setRequestId(null);
          setStep('done');
        }}
      />
    );

  if (step === 'done')
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Password berhasil diganti</h1>
        <p>Silakan login menggunakan nomor telepon dan password baru Anda.</p>
        <Link href="/?requireLogin=true" className="text-primary underline">
          Login
        </Link>
      </div>
    );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutate({ phone: phone.trim() });
      }}
    >
      <h1 className="text-2xl font-semibold">Pulihkan akun Century Padel</h1>
      <p>
        Masukkan nomor telepon yang terdaftar. Kami akan mengirim OTP melalui WhatsApp untuk
        memverifikasi nomor Anda sebelum mengganti password.
      </p>
      <label htmlFor="recovery-phone" className="block text-sm font-medium">
        Nomor telepon
      </label>
      <Input
        id="recovery-phone"
        type="tel"
        autoComplete="tel"
        placeholder="081234567890"
        required
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        disabled={isPending}
      />
      <Button type="submit" loading={isPending}>
        Kirim OTP WhatsApp
      </Button>
    </form>
  );
}
