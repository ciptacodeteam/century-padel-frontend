import { describe, expect, it } from 'vitest';
import {
  formatGatewayPaymentMethod,
  getBookingMembershipLabel,
  getBookingPaymentSources,
  isMembershipBooking
} from './booking-payment';
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

  it('detects explicit and legacy membership bookings without marking regular bookings', () => {
    expect(
      isMembershipBooking(
        booking({
          courtNormalPrice: 300_000,
          details: [{ membershipUserId: 'membership-1' }] as Booking['details']
        })
      )
    ).toBe(true);
    expect(
      isMembershipBooking(
        booking({
          courtNormalPrice: 0,
          details: [{ membershipUserId: null }] as Booking['details']
        })
      )
    ).toBe(true);
    expect(
      isMembershipBooking(
        booking({
          courtNormalPrice: 300_000,
          details: [{ membershipUserId: null }] as Booking['details']
        })
      )
    ).toBe(false);
  });
});

it('shows only membership types and deduplicates repeated slots', () => {
  const peak = {
    membershipUserId: 'peak',
    membershipUser: { membership: { name: 'Paket Peak', type: 'PEAK_HOUR' } }
  };
  const happy = {
    membershipUserId: 'happy',
    membershipUser: { membership: { name: 'Paket Happy', type: 'HAPPY_HOUR' } }
  };
  expect(
    getBookingMembershipLabel({ details: [peak, happy, peak, { membershipUserId: null }] })
  ).toBe('Peak Hour / Happy Hour');
});

it('deduplicates different packages of the same type and supports All Hour', () => {
  const details = [
    {
      membershipUserId: 'happy-1',
      membershipUser: { membership: { name: '100-HOUR HAPPY PACKAGE', type: 'HAPPY_HOUR' } }
    },
    {
      membershipUserId: 'happy-2',
      membershipUser: { membership: { name: '50-HOUR HAPPY PACKAGE', type: 'HAPPY_HOUR' } }
    },
    {
      membershipUserId: 'flex',
      membershipUser: { membership: { name: '200-HOUR FLEX PACKAGE', type: 'ALL_HOUR' } }
    }
  ];
  expect(getBookingMembershipLabel({ details })).toBe('Happy Hour / All Hour');
  expect(
    getBookingPaymentSources(booking({ details: details as Booking['details'] }))[0].label
  ).toBe('Happy Hour / All Hour');
});
