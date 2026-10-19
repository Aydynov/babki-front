import { queryOptions } from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/reports';
import type { BudgetScope } from '@/shared/types';
import { scopedKey } from '@/shared/lib/budget-api';
import { reportsApi } from './reports.api';
import type { FindMonthlyReportsByQuery, FindYearlyReportsByQuery } from '../model/schemas';

export const reportsQueryKeys = {
  all: ['reports'] as const,
  monthly: (query?: FindMonthlyReportsByQuery) => [...reportsQueryKeys.all, 'monthly', query],
  yearly: (query?: FindYearlyReportsByQuery) => [...reportsQueryKeys.all, 'yearly', query],
};

export const reportsQueryOptions = {
  monthly: (query?: FindMonthlyReportsByQuery, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, reportsQueryKeys.monthly(query)),
    queryFn: ({ signal }) => reportsApi.getMonthly(query, scope, signal),
  }),
  yearly: (query?: FindYearlyReportsByQuery, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, reportsQueryKeys.yearly(query)),
    queryFn: ({ signal }) => reportsApi.getYearly(query, scope, signal),
  }),
};

export const useReportsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    monthly: (query?: FindMonthlyReportsByQuery) => reportsQueryOptions.monthly(query, scope),
    yearly: (query?: FindYearlyReportsByQuery) => reportsQueryOptions.yearly(query, scope),
  };
};
