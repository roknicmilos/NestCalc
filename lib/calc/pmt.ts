export function monthlyPayment(
  annualRatePct: number,
  termMonths: number,
  principal: number,
): number {
  if (termMonths <= 0) return 0;
  if (principal <= 0) return 0;
  if (annualRatePct === 0) return principal / termMonths;
  const r = annualRatePct / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}
