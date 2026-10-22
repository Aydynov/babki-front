import { z } from 'zod';
import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
import {
  apiClient,
  dateStringSchema,
  parseRequiredWithSchema,
} from '@/shared/api';
import {
  type FindMonthlyReportsByQuery,
  type FindYearlyReportsByQuery,
  type ReportPeriod,
  reportPeriodSchema,
  findMonthlyReportsByQuerySchema,
  findYearlyReportsByQuerySchema,
} from '../model/schemas';

const reportParams = (query: FindMonthlyReportsByQuery) => ({
  ...utcPeriod(query),
  categories: query.categories?.length ? query.categories.join(',') : undefined,
});

class ReportsApi {
  private readonly client = apiClient;

  getMonthly = async (
    params: FindMonthlyReportsByQuery | undefined,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const query = findMonthlyReportsByQuerySchema.parse(params ?? {});
    const response = await this.client.get<ReportPeriod[]>(
      budgetPath(scope, '/reports/months'),
      {
        params: reportParams(query),
        signal,
      },
    );
    return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
  };

  getYearly = async (
    params: FindYearlyReportsByQuery | undefined,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const query = findYearlyReportsByQuerySchema.parse(params ?? {});
    const currentYear = new Date().getUTCFullYear();
    let firstYear: number;
    if (query.fromDate) {
      firstYear = new Date(query.fromDate).getUTCFullYear();
    } else {
      const response = await this.client.get(budgetPath(scope, '/accounts'), {
        signal,
      });
      const accounts = z
        .array(z.object({ openedAt: dateStringSchema }))
        .parse(response.data);
      if (accounts.length === 0) return [];
      firstYear = Math.min(
        ...accounts.map(({ openedAt }) => new Date(openedAt).getUTCFullYear()),
      );
    }
    const lastYear = query.toDate
      ? new Date(query.toDate).getUTCFullYear()
      : currentYear;
    if (firstYear > lastYear) return [];
    // The backend permits a maximum difference of 100 years per request (101 annual buckets).
    const ranges = Array.from(
      { length: Math.ceil((lastYear - firstYear + 1) / 101) },
      (_, index) => {
        const startYear = firstYear + index * 101;
        const endYear = Math.min(startYear + 100, lastYear);
        return {
          ...query,
          fromDate:
            startYear === firstYear && query.fromDate
              ? query.fromDate
              : `${startYear}-01-01`,
          toDate:
            endYear === lastYear && query.toDate
              ? query.toDate
              : `${endYear}-12-31`,
        };
      },
    );
    const reports = await Promise.all(
      ranges.map(async (range) => {
        const response = await this.client.get<ReportPeriod[]>(
          budgetPath(scope, '/reports/years'),
          {
            params: reportParams(range),
            signal,
          },
        );
        return parseRequiredWithSchema(
          reportPeriodSchema.array(),
          response.data,
        );
      }),
    );
    return reports.flat();
  };
}

export const reportsApi = new ReportsApi();
