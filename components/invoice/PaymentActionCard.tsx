'use client';

import { mockPayInvoiceApi } from '@/api/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { env } from '@/env';
import CreditCardForm, { type CreditCardFormData } from '@/components/forms/payment/CreditCardForm';
import { useXenditCardCollection } from '@/hooks/useXenditTokenization';
import { resolveMediaUrl } from '@/lib/utils';
import { CheckCircle, Copy, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import PaymentCountdown from './PaymentCountdown';

type PaymentAction = {
  descriptor?: string;
  type?: string;
  value?: string;
  url?: string;
  display_name?: string;
  expiry?: string;
};

function ResumeCardPayment({ invoice, sessionId }: { invoice: any; sessionId: string }) {
  const [open, setOpen] = useState(false);
  const { collectCard, isLoading, isScriptReady, error } = useXenditCardCollection();

  const handleSubmit = async (data: CreditCardFormData) => {
    if (!isScriptReady) {
      toast.error(error || 'Sistem pembayaran kartu masih dimuat. Silakan coba lagi.');
      return;
    }

    try {
      const names = data.cardholderName.trim().split(/\s+/);
      const result = await collectCard({
        paymentSessionId: sessionId,
        cardNumber: data.cardNumber.replace(/\s+/g, ''),
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
        cardholderFirstName: names[0] || 'Cardholder',
        cardholderLastName: names.slice(1).join(' ') || 'User',
        cardholderEmail: invoice?.user?.email || undefined,
        cardholderPhoneNumber: invoice?.user?.phone || undefined
      });

      if (!result.actionUrl) {
        throw new Error('Tautan verifikasi kartu tidak tersedia');
      }
      window.location.assign(result.actionUrl);
    } catch (cardError: any) {
      toast.error(cardError?.message || 'Pembayaran kartu gagal diproses. Silakan coba lagi.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          <CreditCard className="mr-2 h-5 w-5" /> Lanjutkan Pembayaran Kartu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Lanjutkan Pembayaran Kartu</DialogTitle>
          <DialogDescription>
            Masukkan kembali data kartu untuk melanjutkan invoice {invoice.number}.
          </DialogDescription>
        </DialogHeader>
        <CreditCardForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showSaveOption={false}
          submitButtonText="Bayar Sekarang"
        />
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentActionCard({
  invoice,
  canPay,
  onChooseMethod,
  onExpired,
  onPaid
}: {
  invoice: any;
  canPay: boolean;
  onChooseMethod: () => void;
  onExpired?: () => void;
  onPaid?: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMockPaying, setIsMockPaying] = useState(false);
  if (!canPay) return null;

  const paymentMeta = invoice?.paymentMeta;
  const payment = invoice?.payment as any;
  const paymentMethod = payment?.method;
  const channelCode = String(
    paymentMeta?.channel_code || paymentMethod?.channel || ''
  ).toUpperCase();
  const actions: PaymentAction[] = Array.isArray(paymentMeta?.actions) ? paymentMeta.actions : [];
  const isMockMode = env.NEXT_PUBLIC_PAYMENT_GATEWAY_MODE === 'mock';

  const isQRIS = channelCode === 'QRIS' || channelCode === 'QR';
  const qrString =
    actions.find((action) => ['QR_STRING', 'QR_CODE'].includes(action.descriptor || ''))?.value ||
    invoice?.paymentInstructions?.qrString ||
    invoice?.paymentInstructions?.qrImage;

  const isVA =
    channelCode === 'VA' ||
    channelCode?.includes('VIRTUAL_ACCOUNT') ||
    channelCode?.includes('_VA');
  const vaAction = actions.find(
    (action) =>
      action.descriptor === 'VIRTUAL_ACCOUNT_NUMBER' || action.descriptor === 'ACCOUNT_NUMBER'
  );
  const vaNumber =
    vaAction?.value ||
    paymentMeta?.channel_properties?.account_number ||
    invoice?.paymentInstructions?.accountNumber;
  const vaDisplayName = vaAction?.display_name || paymentMethod?.name;
  const vaExpiry = vaAction?.expiry || paymentMeta?.channel_properties?.expires_at;

  const paymentExpiry = vaExpiry ? vaExpiry : invoice ? invoice.dueDate : null;

  const isCards = channelCode === 'CARDS';
  const paymentSessionId = paymentMeta?.payment_session_id;
  const redirectAction = actions.find((action) => {
    const type = String(action.type || '').toUpperCase();
    const descriptor = String(action.descriptor || '').toUpperCase();
    return (
      type === 'REDIRECT' ||
      type === 'REDIRECT_CUSTOMER' ||
      ['DEEPLINK_CHECKOUT', 'WEB_URL', 'MOBILE_URL'].includes(descriptor)
    );
  });
  const paymentUrl =
    redirectAction?.url ||
    redirectAction?.value ||
    invoice?.paymentUrl ||
    invoice?.paymentInstructions?.url;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Berhasil disalin!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMockPay = async () => {
    try {
      setIsMockPaying(true);
      await mockPayInvoiceApi(invoice.number || invoice.id);
      toast.success('Mock payment marked as paid');
      onPaid?.();
    } catch (error: any) {
      toast.error(error?.msg || 'Failed to simulate payment');
    } finally {
      setIsMockPaying(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center">
          {paymentMethod && (
            <div className="mb-3 flex flex-col items-center justify-center gap-2">
              {paymentMethod.logo && (
                <Image
                  src={resolveMediaUrl(paymentMethod.logo) || ''}
                  unoptimized
                  alt={paymentMethod.name}
                  width={48}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              )}
              <span className="text-sm font-medium">{paymentMethod.name}</span>
            </div>
          )}

          <h3 className="text-sm text-gray-700">Total Pembayaran</h3>

          <h4 className="mb-6 text-2xl font-bold">
            {currencyFormatter.format(invoice.total).replace(/\s/g, '')}
          </h4>

          {isQRIS && qrString && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4 shadow-md">
                  <div className="bg-white p-2">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`}
                      alt="QR Code"
                      width={200}
                      unoptimized
                      height={200}
                      className="h-48 w-48"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Scan QR code di atas menggunakan aplikasi pembayaran QRIS Anda
              </p>
            </div>
          )}

          {isVA && vaNumber && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="mb-2 text-sm text-gray-600">Nomor Virtual Account</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-bold tracking-wider">{vaNumber}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vaNumber, 'va')}>
                    {copiedField === 'va' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Bank: <span className="font-semibold">{vaDisplayName}</span>
                </div>
              </div>
              <div className="space-y-2 text-left text-sm text-gray-700">
                <p className="font-semibold">Cara Pembayaran:</p>
                <ol className="ml-2 list-inside list-decimal space-y-1">
                  <li>Buka aplikasi mobile banking atau ATM</li>
                  <li>Pilih menu Transfer / Bayar</li>
                  <li>Pilih Virtual Account {vaDisplayName}</li>
                  <li>Masukkan nomor VA di atas</li>
                  <li>
                    Masukkan nominal {currencyFormatter.format(invoice.total).replace(/\s/g, '')}
                  </li>
                  <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
              </div>
            </div>
          )}

          {paymentUrl && !isQRIS && !isVA && !isCards && (
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => window.location.assign(paymentUrl)}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Bayar dengan {paymentMethod?.name}
              </Button>
              <p className="text-sm text-gray-600">
                Anda akan diarahkan ke halaman pembayaran {paymentMethod?.name}
              </p>
            </div>
          )}

          {isCards && paymentSessionId && (
            <ResumeCardPayment invoice={invoice} sessionId={paymentSessionId} />
          )}

          {!isQRIS && !isVA && !paymentUrl && !(isCards && paymentSessionId) && (
            <Button size="lg" className="w-full md:w-auto" onClick={onChooseMethod}>
              <CreditCard className="mr-2 h-5 w-5" /> Muat Ulang Instruksi Pembayaran
            </Button>
          )}

          {paymentExpiry && (
            <div className="mt-5 flex justify-center">
              <PaymentCountdown
                dueDate={paymentExpiry}
                status={invoice.status}
                invoiceId={invoice.id}
                onExpired={onExpired}
              />
            </div>
          )}

          {isMockMode && invoice.status === 'PENDING' && (
            <div className="mt-5 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full md:w-auto"
                onClick={handleMockPay}
                disabled={isMockPaying}
              >
                {isMockPaying ? 'Processing...' : 'Simulate Paid'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});
