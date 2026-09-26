import type { Booking } from '@/types/model';

export type BookingPaymentSource = {
  id: 'gateway' | 'membership' | 'complimentary-credit' | 'free' | 'pending';
  label: string;
};

const formatCreditDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} menit`;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} menit`;
};

export const formatGatewayPaymentMethod = (name: string, channel?: string | null) => {
  const normalizedChannel = channel?.trim().toUpperCase() || '';
  const normalizedName = name.trim();

  if (normalizedChannel === 'QR' || normalizedChannel.includes('QRIS')) {
    return normalizedName.toUpperCase().includes('QR')
      ? normalizedName
      : `QRIS - ${normalizedName}`;
  }

  if (normalizedChannel === 'VA' || normalizedChannel.includes('VIRTUAL_ACCOUNT')) {
    const provider = normalizedName
      .replace(/virtual\s*account/gi, '')
      .replace(/\bva\b/gi, '')
      .replace(/^\s*[-–—:]\s*|\s*[-–—:]\s*$/g, '')
      .trim();
    return provider ? `VA - ${provider}` : 'Virtual Account (VA)';
  }

  if (normalizedChannel === 'CARDS') return 'Kartu Kredit';
  if (normalizedChannel === 'CASH') return 'Tunai';

  if (['GOPAY', 'OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY'].includes(normalizedChannel)) {
    return `E-Wallet - ${normalizedName || normalizedChannel}`;
  }

  return normalizedName || normalizedChannel || 'Pembayaran online';
};

export const getBookingPaymentSources = (booking: Booking): BookingPaymentSource[] => {
  const sources: BookingPaymentSource[] = [];
  const paymentMethod = booking.invoice?.payment?.method;

  if (paymentMethod) {
    sources.push({
      id: 'gateway',
      label: formatGatewayPaymentMethod(paymentMethod.name, paymentMethod.channel)
    });
  }

  if (booking.details?.some((detail) => Boolean(detail.membershipUserId))) {
    sources.push({ id: 'membership', label: 'Membership' });
  }

  const detailCreditMinutes =
    booking.details?.reduce(
      (total, detail) => total + (detail.complimentaryCreditMinutes || 0),
      0
    ) || 0;
  const creditMinutes = booking.complimentaryCreditMinutes || detailCreditMinutes;

  if (creditMinutes > 0) {
    sources.push({
      id: 'complimentary-credit',
      label: `Credit / Saldo Jam Gratis (${formatCreditDuration(creditMinutes)})`
    });
  }

  if (sources.length === 0) {
    const total = booking.totalPrice + (booking.processingFee || 0);
    sources.push(
      total === 0
        ? { id: 'free', label: 'Gratis / Tanpa pembayaran' }
        : { id: 'pending', label: 'Belum dipilih' }
    );
  }

  return sources;
};
