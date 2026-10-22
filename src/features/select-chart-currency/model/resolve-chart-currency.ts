import type { CurrencyCode } from '@/shared/lib/currency';

export const resolveChartCurrency = (
  current: CurrencyCode | undefined,
  available: readonly CurrencyCode[],
): CurrencyCode | undefined => {
  if (current && available.includes(current)) return current;
  return [...available].sort()[0];
};
