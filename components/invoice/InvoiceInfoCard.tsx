import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';
import { CopyButton } from '../ui/clipboard-copy';
import { getStatusColor, getStatusLabel } from './status';

type Props = {
  invoiceNumber?: string;
  dueDate?: string | Date | null;
  paidAt?: string | Date | null;
  invoiceStatus?: string;
};

export default function InvoiceInfoCard({ invoiceNumber, dueDate, paidAt, invoiceStatus }: Props) {
  const transactionDate = paidAt || dueDate;
  const transactionDateLabel = paidAt ? 'Dibayar' : 'Batas bayar';

  return (
    <Card className="h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Invoice
        </CardTitle>
        {invoiceStatus && (
          <Badge className={`${getStatusColor(invoiceStatus)} shrink-0`} variant="outline">
            {getStatusLabel(invoiceStatus)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex min-w-0 items-center gap-1">
          <p className="truncate text-lg font-semibold tracking-tight text-gray-950">
            {invoiceNumber}
          </p>
          <CopyButton variant="ghost" content={invoiceNumber || ''} className="h-8 w-8 shrink-0" />
        </div>
        {transactionDate && (
          <p className="text-sm leading-6 text-gray-500">
            {transactionDateLabel}: {dayjs(transactionDate).format('DD MMM YYYY, HH:mm')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
