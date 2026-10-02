'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import type { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';

type Props = {
  invoiceNumber: string;
  total?: number;
  shareToken?: string;
  className?: string;
  showLabel?: boolean;
  size?: ComponentProps<typeof Button>['size'];
  variant?: ComponentProps<typeof Button>['variant'];
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

export default function InvoiceShareButton({
  invoiceNumber,
  total,
  shareToken,
  className,
  showLabel = true,
  size = 'sm',
  variant = 'outline'
}: Props) {
  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const url = new URL(`/invoice/${encodeURIComponent(invoiceNumber)}`, window.location.origin);
    if (shareToken) url.searchParams.set('share', shareToken);
    const amount = typeof total === 'number' ? ` senilai ${currencyFormatter.format(total)}` : '';
    const shareData = {
      title: `Invoice ${invoiceNumber} - Century Padel`,
      text: `Invoice Century Padel ${invoiceNumber}${amount}.`,
      url: url.toString()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url.toString());
      toast.success('Tautan invoice berhasil disalin.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      try {
        await navigator.clipboard.writeText(url.toString());
        toast.success('Tautan invoice berhasil disalin.');
      } catch {
        toast.error('Invoice belum berhasil dibagikan. Silakan coba lagi.');
      }
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(!showLabel && 'size-9 p-0', className)}
      onClick={handleShare}
      aria-label={`Bagikan invoice ${invoiceNumber}`}
    >
      <Share2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
      {showLabel && 'Bagikan Invoice'}
    </Button>
  );
}
