import type { CurrencyCode } from '@/shared/lib/currency';

export const resolveChartCurrency = (
  current: CurrencyCode | undefined,
  available: readonly CurrencyCode[],
  defaultCurrency: CurrencyCode,
): CurrencyCode | undefined => {
  if (current && available.includes(current)) return current;
  if (available.includes(defaultCurrency)) return defaultCurrency;
  return [...available].sort()[0];
};
