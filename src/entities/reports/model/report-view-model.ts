import type { CurrencyCode } from '@/shared/lib/currency';
import { sortCurrencyCodes } from '@/shared/lib/currency';
import type { ReportCurrency, ReportPeriod } from './schemas';

export type ReportMetric = keyof Pick<
  ReportCurrency,
  'balance' | 'expenses' | 'incomes' | 'saving' | 'transfersIn' | 'transfersOut'
>;

const getPeriod = (reports: ReportPeriod[] | undefined, period: string | number) => (
  reports?.find((report) => String(report.period) === String(period))
);

const getEmptyCurrencyBucket = (currency: CurrencyCode): ReportCurrency => ({
  currency,
  incomes: 0,
  expenses: 0,
  transfersIn: 0,
  transfersOut: 0,
  balance: 0,
  saving: 0,
  expensesByCategory: [],
});

export const getReportCurrencySections = (
  reports: ReportPeriod[] | undefined,
  period: string | number,
  defaultCurrency: CurrencyCode,
) => {
  const reportCurrencies = getPeriod(reports, period)?.currencies ?? [];
  const currencies = reportCurrencies.length > 0
    ? reportCurrencies
    : [getEmptyCurrencyBucket(defaultCurrency)];
  const order = sortCurrencyCodes(currencies.map(({ currency }) => currency), defaultCurrency);
  return [...currencies].sort((left, right) => (
    order.indexOf(left.currency) - order.indexOf(right.currency)
  ));
};

export const getReportMetricSections = (
  reports: ReportPeriod[] | undefined,
  period: string | number,
  previousPeriod: string | number,
  metric: ReportMetric,
  defaultCurrency: CurrencyCode,
) => {
  const current = getReportCurrencySections(reports, period, defaultCurrency);
  const previous = getPeriod(reports, previousPeriod)?.currencies ?? [];
  return current.map((bucket) => ({
    currency: bucket.currency,
    value: bucket[metric],
    previousValue: previous.find(({ currency }) => currency === bucket.currency)?.[metric] ?? 0,
  }));
};

export const getMonthlyCurrencySeries = (
  reports: ReportPeriod[] | undefined,
  defaultCurrency: CurrencyCode,
) => {
  const order = sortCurrencyCodes(
    reports?.flatMap(({ currencies }) => currencies.map(({ currency }) => currency)) ?? [],
    defaultCurrency,
  );
  if (order.length === 0) order.push(defaultCurrency);
  return order.map((currency) => ({
    currency,
    periods: reports?.map((report) => ({
      period: report.period,
      ...(report.currencies.find((bucket) => bucket.currency === currency) ?? {
        currency,
        incomes: 0,
        expenses: 0,
        transfersIn: 0,
        transfersOut: 0,
        balance: 0,
        saving: 0,
        expensesByCategory: [],
      }),
    })) ?? [],
  }));
};
