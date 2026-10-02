import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveMediaUrl } from '@/lib/utils';
import { Receipt } from 'lucide-react';
import Image from 'next/image';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});
const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

type Method = { name?: string; logo?: string; channel?: string } | undefined;

export default function PaymentSummaryCard({
  subtotal,
  processingFee,
  promoDiscountAmount,
  total,
  method,
  receipt = false
}: {
  subtotal: number;
  processingFee: number;
  promoDiscountAmount?: number;
  total: number;
  method?: Method;
  receipt?: boolean;
}) {
  return (
    <Card
      className={
        receipt
          ? 'gap-0 rounded-none border-x-0 border-b-0 py-0 shadow-none'
          : 'gap-0 overflow-hidden rounded-xl py-0 shadow-sm'
      }
    >
      <CardHeader className="border-b border-gray-100 px-5 py-5 sm:px-8 sm:py-6">
        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
          <span className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
            <Receipt className="text-primary h-4 w-4" />
          </span>
          <span>{receipt ? 'Rincian Pembayaran' : 'Ringkasan Pembayaran'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-8 sm:py-6">
        <div className={method ? 'grid gap-6 md:grid-cols-[1fr_1.25fr] md:gap-10' : ''}>
          {method && (
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Metode pembayaran
              </p>
              <div className="flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                {method.logo && (
                  <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-gray-200">
                    <Image
                      src={resolveMediaUrl(method.logo) || ''}
                      unoptimized
                      alt={method.name || 'Payment Method'}
                      width={48}
                      height={24}
                      className="h-auto max-h-6 w-full object-contain"
                    />
                  </div>
                )}
                <span className="font-semibold text-gray-900">
                  {method.name || 'Transfer Bank'}
                </span>
              </div>
            </div>
          )}

          <div className={method ? 'border-t pt-5 md:border-t-0 md:pt-0' : ''}>
            <div className="flex items-center justify-between gap-6 py-2 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            {promoDiscountAmount && promoDiscountAmount > 0 && (
              <div className="flex items-center justify-between gap-6 py-2 text-sm text-green-600">
                <span>Diskon</span>
                <span className="font-semibold">-{formatCurrency(promoDiscountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-6 py-2 text-sm">
              <span className="text-gray-500">Biaya layanan</span>
              <span className="font-semibold text-gray-900">
                {processingFee > 0 ? formatCurrency(processingFee) : 'Gratis'}
              </span>
            </div>
          </div>
        </div>

        {!receipt && (
          <div className="bg-primary/5 mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1 rounded-xl px-4 py-4 sm:mt-6 sm:px-5">
            <p className="text-sm font-medium text-gray-600">Total pembayaran</p>
            <p className="text-primary text-2xl font-bold tracking-tight sm:text-3xl">
              {formatCurrency(total)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
