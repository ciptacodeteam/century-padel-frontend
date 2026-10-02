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
    <Card className="h-full gap-1.5 py-2.5 sm:gap-2 sm:py-3">
      <CardHeader className="flex-row items-center justify-between px-4">
        <CardTitle>Invoice</CardTitle>
        {invoiceStatus && (
          <Badge className={getStatusColor(invoiceStatus)} variant="outline">
            {getStatusLabel(invoiceStatus)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4">
        <div className="flex min-w-0 items-center">
          <p className="truncate font-semibold">{invoiceNumber}</p>
          <CopyButton variant="ghost" content={invoiceNumber || ''} className="ml-1 h-7 w-7" />
        </div>
        {transactionDate && (
          <p className="text-sm text-gray-600">
            {transactionDateLabel}: {dayjs(transactionDate).format('DD MMM YYYY, HH:mm')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
