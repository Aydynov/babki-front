import { reportPeriodSchema } from '@/entities/reports/@x/incomes';
import { z } from 'zod';
import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateIncomeDto,
  createIncomeSchema,
  type Income,
  incomeRevenueSchema,
  incomeSchema,
  type IncomesPaginatedResponse,
  incomesPaginatedResponseSchema,
  type ListIncomesQuery,
  listIncomesQuerySchema,
  type UpdateIncomeDto,
  updateIncomeSchema,
} from '../model/schemas';

class IncomesApi {
  private readonly client = apiClient;

  create = async (
    payload: CreateIncomeDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = createIncomeSchema
      .extend({ amount: z.number().positive() })
      .parse(payload);
    const response = await this.client.post<Income>(
      budgetPath(scope, '/incomes'),
      body,
    );

    return parseRequiredWithSchema(incomeSchema, response.data);
  };

  findAll = async (
    query: ListIncomesQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const params = listIncomesQuerySchema.parse(query);
    const response = await this.client.get<IncomesPaginatedResponse>(
      budgetPath(scope, '/incomes'),
      {
        params: utcPeriod(params),
        signal,
      },
    );

    return parseRequiredWithSchema(
      incomesPaginatedResponseSchema,
      response.data,
    );
  };

  findTotalRevenue = async (
    query: ListIncomesQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get(
      budgetPath(scope, '/reports/months'),
      {
        params: utcPeriod({ fromDate: query.fromDate, toDate: query.toDate }),
        signal,
      },
    );
    const reports = reportPeriodSchema.array().parse(response.data);
    const totals = new Map<string, number>();
    reports.forEach((report) => {
      report.currencies.forEach((bucket) => {
        if (!query.currency || query.currency === bucket.currency) {
          totals.set(
            bucket.currency,
            (totals.get(bucket.currency) ?? 0) + bucket.incomes,
          );
        }
      });
    });
    const currencies = [...totals].map(([currency, totalRevenue]) => ({
      currency,
      totalRevenue,
    }));
    return incomeRevenueSchema.parse({
      currencies,
      totalRevenue:
        currencies.length > 1 ? null : (currencies[0]?.totalRevenue ?? 0),
    });
  };

  findOne = async (
    incomeId: string,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<Income>(
      budgetPath(scope, `/incomes/${incomeId}`),
      {
        signal,
      },
    );

    return parseRequiredWithSchema(incomeSchema, response.data);
  };

  update = async (
    incomeId: string,
    payload: UpdateIncomeDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = updateIncomeSchema
      .extend({ amount: z.number().positive().optional() })
      .parse(payload);
    const response = await this.client.patch<Income>(
      budgetPath(scope, `/incomes/${incomeId}`),
      body,
    );

    return parseRequiredWithSchema(incomeSchema, response.data);
  };
}

export const incomesApi = new IncomesApi();
