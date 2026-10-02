'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toBlob } from 'html-to-image';
import { Share2 } from 'lucide-react';
import {
  useEffect,
  useState,
  type ComponentProps,
  type MouseEvent,
  type RefObject
} from 'react';
import { toast } from 'sonner';

type Props = {
  invoiceNumber: string;
  className?: string;
  showLabel?: boolean;
  size?: ComponentProps<typeof Button>['size'];
  variant?: ComponentProps<typeof Button>['variant'];
  captureRef: RefObject<HTMLElement | null>;
  captureKey?: string;
};

const waitForImage = async (image: HTMLImageElement) => {
  if (image.complete) {
    await image.decode().catch(() => undefined);
    return;
  }

  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
    window.setTimeout(finish, 5_000);
  });
};

const createInvoiceImage = async (element: HTMLElement, invoiceNumber: string) => {
  await document.fonts?.ready;
  await Promise.all(Array.from(element.querySelectorAll('img')).map(waitForImage));

  const blob = await toBlob(element, {
    backgroundColor: '#ffffff',
    // Next Image relies on its `url`, `w`, and `q` query parameters.
    // Keep them in the cache key and do not append an unsupported parameter.
    includeQueryParams: true,
    pixelRatio: 2
  });

  if (!blob) throw new Error('Invoice image could not be generated');

  const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
  return new File([blob], `invoice-${safeInvoiceNumber}.png`, {
    type: 'image/png',
    lastModified: Date.now()
  });
};

export default function InvoiceShareButton({
  invoiceNumber,
  className,
  showLabel = true,
  size = 'sm',
  variant = 'outline',
  captureRef,
  captureKey
}: Props) {
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepareInvoiceImage = async () => {
      const element = captureRef.current;
      if (!element) {
        if (!cancelled) setIsPreparing(false);
        return;
      }

      setIsPreparing(true);
      setPreparedFile(null);

      try {
        const file = await createInvoiceImage(element, invoiceNumber);
        if (!cancelled) setPreparedFile(file);
      } catch (error) {
        console.error('Failed to prepare invoice image:', error);
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    };

    void prepareInvoiceImage();

    return () => {
      cancelled = true;
    };
  }, [captureKey, captureRef, invoiceNumber]);

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

    let invoiceFile = preparedFile;
    setIsSharing(true);

    try {
      if (!invoiceFile) {
        invoiceFile = await createInvoiceImage(captureRef.current, invoiceNumber);
        setPreparedFile(invoiceFile);
      }

      const canShareFile =
        typeof navigator.share === 'function' &&
        (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [invoiceFile] }));

      if (canShareFile) {
        // Sharing the file by itself keeps mobile share targets from dropping
        // the image in favour of the accompanying text.
        await navigator.share({ files: [invoiceFile] });
      } else {
        downloadInvoiceImage(invoiceFile);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (invoiceFile) {
        downloadInvoiceImage(invoiceFile);
      } else {
        toast.error('Gambar invoice belum berhasil dibuat. Silakan coba lagi.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(!showLabel && 'size-9 p-0', className)}
      onClick={handleShare}
      loading={isPreparing || isSharing}
      aria-label={`Bagikan invoice ${invoiceNumber}`}
    >
      <Share2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
      {showLabel && 'Bagikan Invoice'}
    </Button>
  );
}
