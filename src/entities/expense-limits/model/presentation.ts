import type { CurrencyCode } from '@/shared/lib/currency';
import type { ExpenseLimit } from './schemas';

export const getExpenseLimitsForCurrency = <T extends Pick<ExpenseLimit, 'currency'>>(
  limits: readonly T[] | undefined,
  currency: CurrencyCode | undefined,
): T[] => (limits ?? []).filter((limit) => limit.currency === currency);

export const getExpenseLimitTotal = (
  limits: readonly Pick<ExpenseLimit, 'currency' | 'total'>[] | undefined,
  currency: CurrencyCode,
) => getExpenseLimitsForCurrency(limits, currency).reduce((total, limit) => total + limit.total, 0);

export const getExpenseLimitProgress = ({ total, rest }: Pick<ExpenseLimit, 'total' | 'rest'>) => (
  total > 0 ? Math.min(100, Math.max(0, ((total - rest) / total) * 100)) : 0
);
