import type { ReportPeriod } from './schemas';

export const getMonthlyExpenseCategoryBuckets = (
  reports: ReportPeriod[] | undefined,
  period: string,
) => [...(reports?.find((report) => report.period === period)?.currencies ?? [])]
  .filter(({ expenses }) => expenses > 0)
  .sort((left, right) => left.currency.localeCompare(right.currency));
