import type { CurrencyCode } from '@/shared/lib/currency';

export const getDailyExpenseCurrencies = (expenses: readonly { currency: CurrencyCode }[]): CurrencyCode[] => (
  [...new Set(expenses.map(({ currency }) => currency))].sort()
);

interface MonthlyMetric {
  expenses: number;
  incomes: number;
  saving: number;
  transfersIn: number;
  transfersOut: number;
}

export const getMonthlyMetricCurrencies = (
  series: readonly { currency: CurrencyCode; periods: readonly MonthlyMetric[] }[],
): CurrencyCode[] => series
  .filter(({ periods }) => periods.some((period) => (
    period.expenses !== 0 || period.incomes !== 0 || period.saving !== 0
      || period.transfersIn !== 0 || period.transfersOut !== 0
  )))
  .map(({ currency }) => currency)
  .sort();

export const getAnnualCategoryCurrencies = (
  sections: readonly { currency: CurrencyCode; expensesByCategory: readonly { total: number }[] }[],
): CurrencyCode[] => sections
  .filter(({ expensesByCategory }) => expensesByCategory.some(({ total }) => total > 0))
  .map(({ currency }) => currency)
  .sort();
