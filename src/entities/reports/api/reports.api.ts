import { z } from 'zod';
import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
import { apiClient, dateStringSchema, parseRequiredWithSchema } from '@/shared/api';
import {
  type FindMonthlyReportsByQuery,
  type FindYearlyReportsByQuery,
  type ReportPeriod,
  reportPeriodSchema,
} from '../model/schemas';

class ReportsApi {
  private readonly client = apiClient;

  getMonthly = async (
    params?: FindMonthlyReportsByQuery,
    scope?: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<ReportPeriod[]>(budgetPath(scope, '/reports/months'), {
      params: scope?.kind === 'group' ? utcPeriod(params ?? {}) : params,
      signal,
    });
    return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
  };

  getYearly = async (
    params?: FindYearlyReportsByQuery & { fromDate?: string; toDate?: string },
    scope?: BudgetScope,
    signal?: AbortSignal,
  ) => {
    if (scope?.kind !== 'group') {
      const response = await this.client.get<ReportPeriod[]>('/reports/years', { params, signal });
      return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
    }
    const currentYear = new Date().getUTCFullYear();
    let firstYear: number;
    if (params?.fromDate) {
      firstYear = new Date(params.fromDate).getUTCFullYear();
    } else {
      const response = await this.client.get(budgetPath(scope, '/accounts'), { signal });
      const accounts = z.array(z.object({ openedAt: dateStringSchema })).parse(response.data);
      if (accounts.length === 0) return [];
      firstYear = Math.min(...accounts.map(({ openedAt }) => new Date(openedAt).getUTCFullYear()));
    }
    const lastYear = params?.toDate ? new Date(params.toDate).getUTCFullYear() : currentYear;
    if (firstYear > lastYear) return [];
    // The backend permits a maximum difference of 100 years per request (101 annual buckets).
    const ranges = Array.from({ length: Math.ceil((lastYear - firstYear + 1) / 101) }, (_, index) => {
      const startYear = firstYear + index * 101;
      const endYear = Math.min(startYear + 100, lastYear);
      return {
        ...params,
        fromDate: startYear === firstYear && params?.fromDate ? params.fromDate : `${startYear}-01-01`,
        toDate: endYear === lastYear && params?.toDate ? params.toDate : `${endYear}-12-31`,
      };
    });
    const reports = await Promise.all(ranges.map(async (range) => {
      const response = await this.client.get<ReportPeriod[]>(budgetPath(scope, '/reports/years'), {
        params: utcPeriod(range), signal,
      });
      return parseRequiredWithSchema(reportPeriodSchema.array(), response.data);
    }));
    return reports.flat();
  };
}

export const reportsApi = new ReportsApi();
