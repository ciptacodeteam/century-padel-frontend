export function calculatePaymentFee(
  subtotal: number,
  fixedFee: number | null | undefined,
  percentage: number | string | null | undefined
) {
  const normalizedSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const normalizedFixedFee = Number.isFinite(Number(fixedFee)) ? Math.max(0, Number(fixedFee)) : 0;
  const percentageRate = Number.isFinite(Number(percentage))
    ? Math.max(0, Number(percentage))
    : 0;
  const percentageFee = Math.round((normalizedSubtotal * percentageRate) / 100);
  const baseFee = normalizedFixedFee + percentageFee;
  const vat = Math.round(baseFee * 0.11);

  return {
    fixedFee: normalizedFixedFee,
    percentageRate,
    percentageFee,
    vat,
    totalFee: baseFee + vat
  };
}
