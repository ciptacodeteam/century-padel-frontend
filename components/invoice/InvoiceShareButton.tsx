'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toBlob } from 'html-to-image';
import { Share2 } from 'lucide-react';
import { useState, type ComponentProps, type MouseEvent, type RefObject } from 'react';
import { toast } from 'sonner';

type Props = {
  invoiceNumber: string;
  total?: number;
  className?: string;
  showLabel?: boolean;
  size?: ComponentProps<typeof Button>['size'];
  variant?: ComponentProps<typeof Button>['variant'];
  captureRef: RefObject<HTMLElement | null>;
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

export default function InvoiceShareButton({
  invoiceNumber,
  total,
  className,
  showLabel = true,
  size = 'sm',
  variant = 'outline',
  captureRef
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadInvoiceImage = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    toast.success('Gambar invoice berhasil diunduh.');
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!captureRef.current) {
      toast.error('Invoice belum siap dibagikan. Silakan coba lagi.');
      return;
    }

    const amount = typeof total === 'number' ? ` senilai ${currencyFormatter.format(total)}` : '';
    let generatedFile: File | null = null;
    setIsGenerating(true);

    try {
      const blob = await toBlob(captureRef.current, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2
      });

      if (!blob) throw new Error('Invoice image could not be generated');

      const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
      const file = new File([blob], `invoice-${safeInvoiceNumber}.png`, {
        type: 'image/png'
      });
      generatedFile = file;
      const shareData = {
        title: `Invoice ${invoiceNumber} - Century Padel`,
        text: `Invoice Century Padel ${invoiceNumber}${amount}.`,
        files: [file]
      };

      const canShareFile =
        typeof navigator.share === 'function' &&
        (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }));

      if (canShareFile) {
        await navigator.share(shareData);
      } else {
        downloadInvoiceImage(file);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (generatedFile) {
        downloadInvoiceImage(generatedFile);
      } else {
        toast.error('Gambar invoice belum berhasil dibuat. Silakan coba lagi.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(!showLabel && 'size-9 p-0', className)}
      onClick={handleShare}
      loading={isGenerating}
      aria-label={`Bagikan invoice ${invoiceNumber}`}
    >
      <Share2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
      {showLabel && 'Bagikan Invoice'}
    </Button>
  );
}
