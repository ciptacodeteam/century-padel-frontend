'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { getInvoiceApi } from '@/api/booking';
import { CheckCircle, Clock3, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get('invoice_id');

  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'paid' | 'pending'>(
    'checking'
  );

  // Poll the invoice until the Xendit webhook confirms payment.
  useEffect(() => {
    if (!invoiceNumber) {
      setVerificationStatus('pending');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkPayment = async (attempt: number) => {
      try {
        const response = await getInvoiceApi(invoiceNumber);
        const status = response?.data?.status;

        if (cancelled) return;
        if (status === 'PAID') {
          setVerificationStatus('paid');
          return;
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      if (cancelled) return;
      if (attempt >= 9) {
        setVerificationStatus('pending');
        return;
      }

      timer = setTimeout(() => void checkPayment(attempt + 1), 2000);
    };

    void checkPayment(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [invoiceNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-16">
      <MainHeader
        title="Status Pembayaran"
        backHref="/booking"
        withCartBadge={false}
        withLogo={false}
        withBorder
      />

      <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
        <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
          {verificationStatus === 'checking' ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-primary h-16 w-16 animate-spin" />
                <h1 className="text-center text-2xl font-bold text-gray-800">
                  Verifying Your Payment...
                </h1>
                <p className="text-center text-gray-600">
                  Please wait while we confirm your payment with the bank.
                </p>
              </div>
            </>
          ) : verificationStatus === 'paid' ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-center text-3xl font-bold text-gray-800">
                  Payment Successful!
                </h1>
                <p className="text-center text-lg text-gray-600">
                  Your booking has been confirmed. Thank you for your payment!
                </p>
              </div>

              {invoiceNumber && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Invoice:</span> {invoiceNumber}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    A confirmation email has been sent to your registered email address.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button size="lg" className="w-full" onClick={() => router.push('/invoice')}>
                  Lihat Transaksi Saya
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-amber-100 p-4">
                <Clock3 className="h-16 w-16 text-amber-600" />
              </div>
              <h1 className="text-center text-2xl font-bold text-gray-800">
                Pembayaran Belum Terkonfirmasi
              </h1>
              <p className="text-center text-gray-600">
                Kami belum menerima konfirmasi pembayaran. Status transaksi tidak akan diubah
                menjadi berhasil sebelum pembayaran dikonfirmasi oleh Xendit.
              </p>
              {invoiceNumber && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/invoice/${invoiceNumber}`)}
                >
                  Kembali ke Detail Transaksi
                </Button>
              )}
            </div>
          )}
        </div>

        {verificationStatus === 'paid' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-center text-sm text-blue-700">
              <strong>✓ Pembayaran Telah Dikonfirmasi</strong>
              <br />
              Pembayaran Anda diproses dengan aman melalui Xendit.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-16">
          <MainHeader
            title="Payment Success"
            backHref="/booking"
            withCartBadge={false}
            withLogo={false}
            withBorder
          />
          <main className="mx-auto flex w-11/12 max-w-2xl flex-col items-center gap-6 pt-32">
            <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-primary h-16 w-16 animate-spin" />
                <h1 className="text-center text-2xl font-bold text-gray-800">Loading...</h1>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
