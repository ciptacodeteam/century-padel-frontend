import { describe, expect, it } from 'vitest';
import type { MembershipUser } from '@/types/model';
import { getMembershipTransactionStatus } from './membership-transaction-status';

const transaction = (status: string, fields = {}) =>
  ({
    acquisitionType: 'PURCHASE',
    isExpired: false,
    isSuspended: false,
    invoice: { status },
    ...fields
  }) as MembershipUser;

describe('membership transaction status', () => {
  it('does not label an unpaid membership active', () => {
    expect(getMembershipTransactionStatus(transaction('PENDING')).label).toBe(
      'Menunggu Pembayaran'
    );
  });
  it.each(['CANCELLED', 'EXPIRED', 'FAILED'])(
    'labels %s payments canceled even with legacy active flags',
    (status) => {
      expect(getMembershipTransactionStatus(transaction(status)).label).toBe('Canceled');
    }
  );
  it('shows paid membership activity and suspension', () => {
    expect(getMembershipTransactionStatus(transaction('PAID')).label).toBe('Aktif');
    expect(getMembershipTransactionStatus(transaction('PAID', { isSuspended: true })).label).toBe(
      'Ditangguhkan'
    );
  });
  it('keeps transferred balance active without a purchase invoice', () => {
    expect(
      getMembershipTransactionStatus(
        transaction('', { acquisitionType: 'TRANSFER', invoice: null })
      ).label
    ).toBe('Aktif');
  });
  it('preserves refunded and expired membership labels', () => {
    expect(getMembershipTransactionStatus(transaction('PAID', { isExpired: true })).label).toBe(
      'Kedaluwarsa'
    );
    expect(
      getMembershipTransactionStatus(
        transaction('PAID', { invoice: { status: 'PAID', payment: { meta: { refund: {} } } } })
      ).label
    ).toBe('Dihentikan & Refund');
  });
});
