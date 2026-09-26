import { describe, expect, it } from 'vitest';
import { formatGatewayPaymentMethod, getBookingPaymentSources } from './booking-payment';
import type { Booking } from '@/types/model';

const booking = (overrides: Partial<Booking> = {}) =>
  ({
    totalPrice: 0,
    processingFee: 0,
    complimentaryCreditMinutes: 0,
    details: [],
    ...overrides
  }) as Booking;

describe('booking payment sources', () => {
  it('formats common gateway channels', () => {
    expect(formatGatewayPaymentMethod('BCA Virtual Account', 'BCA_VIRTUAL_ACCOUNT')).toBe(
      'VA - BCA'
    );
    expect(formatGatewayPaymentMethod('QRIS', 'QRIS')).toBe('QRIS');
    expect(formatGatewayPaymentMethod('Credit Card', 'CARDS')).toBe('Kartu Kredit');
  });

  it('shows combined gateway, membership, and member credit sources', () => {
    const result = getBookingPaymentSources(
      booking({
        complimentaryCreditMinutes: 90,
        invoice: {
          payment: {
            method: { name: 'BCA Virtual Account', channel: 'BCA_VIRTUAL_ACCOUNT' }
          }
        } as Booking['invoice'],
        details: [
          { membershipUserId: 'membership-1', complimentaryCreditMinutes: 90 }
        ] as Booking['details']
      })
    );

    expect(result.map((source) => source.label)).toEqual([
      'VA - BCA',
      'Membership',
      'Credit / Saldo Jam Gratis (1 jam 30 menit)'
    ]);
  });

  it('does not mistake an unpaid booking for a free booking', () => {
    expect(getBookingPaymentSources(booking({ totalPrice: 380_000 }))[0].label).toBe(
      'Belum dipilih'
    );
    expect(getBookingPaymentSources(booking())[0].label).toBe('Gratis / Tanpa pembayaran');
  });
});
