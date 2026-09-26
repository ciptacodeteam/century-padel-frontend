import { Badge } from '@/components/ui/badge';
import { getBookingPaymentSources } from '@/lib/booking-payment';
import type { Booking } from '@/types/model';

export function BookingPaymentSources({ booking }: { booking: Booking }) {
  const sources = getBookingPaymentSources(booking);

  return (
    <div>
      <p className="text-muted-foreground text-sm">Metode Pembayaran</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <Badge key={source.id} variant="outline" className="font-medium">
            {source.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
