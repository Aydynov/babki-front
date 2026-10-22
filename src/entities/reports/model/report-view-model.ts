import { sortCurrencyCodes } from '@/shared/lib/currency';
import type { ReportCurrency, ReportPeriod } from './schemas';

export type ReportMetric = keyof Pick<
  ReportCurrency,
  'balance' | 'expenses' | 'incomes' | 'saving' | 'transfersIn' | 'transfersOut'
>;

const getPeriod = (reports: ReportPeriod[] | undefined, period: string | number) => (
  reports?.find((report) => String(report.period) === String(period))
);

export const getReportCurrencySections = (
  reports: ReportPeriod[] | undefined,
  period: string | number,
) => [...(getPeriod(reports, period)?.currencies ?? [])]
  .sort((left, right) => left.currency.localeCompare(right.currency));

export const getReportMetricSections = (
  reports: ReportPeriod[] | undefined,
  period: string | number,
  previousPeriod: string | number,
  metric: ReportMetric,
) => {
  const previous = getPeriod(reports, previousPeriod)?.currencies ?? [];
  return getReportCurrencySections(reports, period).map((bucket) => ({
    currency: bucket.currency,
    value: bucket[metric],
    previousValue: previous.find(({ currency }) => currency === bucket.currency)?.[metric] ?? 0,
  }));
};

export const getMonthlyCurrencySeries = (reports: ReportPeriod[] | undefined) => {
  const order = sortCurrencyCodes(
    reports?.flatMap(({ currencies }) => currencies.map(({ currency }) => currency)) ?? [],
  );
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
