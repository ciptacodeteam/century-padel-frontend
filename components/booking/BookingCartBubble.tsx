'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IconShoppingCartFilled } from '@tabler/icons-react';

type BookingCartBubbleProps = {
  itemCount: number;
  subtotal: number;
  onProceed: () => void;
  disabled?: boolean;
};

export default function BookingCartBubble({
  itemCount,
  subtotal,
  onProceed,
  disabled = false
}: BookingCartBubbleProps) {
  return (
    <div
      className={cn(
        'fixed right-6 bottom-6 z-40 hidden items-center gap-4 rounded-full border bg-white px-5 py-3 shadow-lg transition-all duration-300 lg:flex',
        itemCount > 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <div className="relative flex items-center justify-center">
        <IconShoppingCartFilled className="text-primary size-6" />
        <Badge className="bg-badge absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
          {itemCount}
        </Badge>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <span className="text-muted-foreground text-xs">Subtotal</span>
          <p className="text-base font-semibold">Rp{subtotal.toLocaleString('id-ID')}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Slot Terpilih</span>
          <p className="text-base font-semibold">{itemCount}</p>
        </div>
      </div>

      <Button size="lg" onClick={onProceed} disabled={disabled} className="rounded-full px-6">
        Pilih Jadwal
      </Button>
    </div>
  );
}
