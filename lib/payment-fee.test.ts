import { describe, expect, it } from 'vitest';

import { calculatePaymentFee } from './payment-fee';

describe('calculatePaymentFee', () => {
  it('matches the backend fixed fee, percentage fee, and VAT calculation', () => {
    expect(calculatePaymentFee(100_000, 2_000, 1)).toEqual({
      fixedFee: 2_000,
      percentageRate: 1,
      percentageFee: 1_000,
      vat: 330,
      totalFee: 3_330
    });
  });

  it('normalizes missing and invalid fee values', () => {
    expect(calculatePaymentFee(100_000, undefined, undefined).totalFee).toBe(0);
    expect(calculatePaymentFee(100_000, -1, -1).totalFee).toBe(0);
  });
});
