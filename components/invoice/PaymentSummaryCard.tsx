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
  method
}: {
  subtotal: number;
  processingFee: number;
  promoDiscountAmount?: number;
  total: number;
  method?: Method;
}) {
  return (
    <Card className="mb-4 gap-2 py-3">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="text-primary h-4 w-4" />
          <span>Ringkasan Pembayaran</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-[1fr_auto] items-end gap-3 px-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <p className="text-gray-500">Subtotal</p>
            <p className="font-semibold">{formatCurrency(subtotal)}</p>
          </div>
          {promoDiscountAmount && promoDiscountAmount > 0 && (
            <div className="text-green-600">
              <p>Diskon</p>
              <p className="font-semibold">-{formatCurrency(promoDiscountAmount)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Biaya layanan</p>
            <p className="font-semibold">
              {processingFee > 0 ? formatCurrency(processingFee) : 'Gratis'}
            </p>
          </div>
          {method && (
            <div>
              <p className="text-gray-500">Metode</p>
              <div className="flex items-center gap-2 font-semibold">
                {method.logo && (
                  <div className="flex h-5 w-10 items-center justify-center">
                    <Image
                      src={resolveMediaUrl(method.logo) || ''}
                      unoptimized
                      alt={method.name || 'Payment Method'}
                      width={40}
                      height={20}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                )}
                <span>{method.name || 'Transfer Bank'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-primary/5 rounded-md px-3 py-2 text-right sm:px-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-primary text-lg font-bold">{formatCurrency(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
