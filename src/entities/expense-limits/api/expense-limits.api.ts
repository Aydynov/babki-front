import { z } from 'zod';
import { resolveExpenseCategory } from '@/entities/expense-categories/@x/expense-limits';
import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import type { ExpensesPaginatedResponse } from '@/entities/expenses/@x/expense-limits';
import { apiClient } from '@/shared/api';
import {
  createExpenseLimitSchema,
  type CreateExpenseLimitDto,
  expenseLimitSchema,
  type UpdateExpenseLimitDto,
  updateExpenseLimitSchema,
  type ExpenseLimit,
  type FindExpenseLimitQuery,
  findExpenseLimitQuerySchema,
} from '../model/schemas';

class ExpenseLimitsApi {
  private static normalize = async (value: unknown, scope: BudgetScope, signal?: AbortSignal) => {
    const raw = z
      .object({ category: z.string().regex(/^[a-f\d]{24}$/i) })
      .passthrough()
      .parse(value);
    const category = await resolveExpenseCategory(raw.category, scope, signal);
    if (!category) throw new Error('Категория лимита недоступна');
    return expenseLimitSchema.parse({ ...raw, category });
  };

  private readonly client = apiClient;

  create = async (
    payload: CreateExpenseLimitDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = createExpenseLimitSchema
      .extend({ total: z.number().min(0) })
      .parse(payload);
    const response = await this.client.post<ExpenseLimit>(
      budgetPath(scope, '/expense-limits'),
      body,
    );
    return ExpenseLimitsApi.normalize(response.data, scope);
  };

  findAll = async (
    params: FindExpenseLimitQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<ExpensesPaginatedResponse>(
      budgetPath(scope, '/expense-limits'),
      {
        params: findExpenseLimitQuerySchema.parse(params),
        signal,
      },
    );
    return Promise.all(
      z
        .array(z.unknown())
        .parse(response.data)
        .map((item) => ExpenseLimitsApi.normalize(item, scope, signal)),
    );
  };

  findOne = async (
    limitId: string,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<ExpenseLimit>(
      budgetPath(scope, `/expense-limits/${limitId}`),
      {
        signal,
      },
    );
    return ExpenseLimitsApi.normalize(response.data, scope, signal);
  };

  update = async (
    limitId: string,
    payload: UpdateExpenseLimitDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = updateExpenseLimitSchema.parse(payload);
    const response = await this.client.patch<ExpenseLimit>(
      budgetPath(scope, `/expense-limits/${limitId}`),
      body,
    );
    return ExpenseLimitsApi.normalize(response.data, scope);
  };

  delete = async (
    limitId: string,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    await this.client.delete(budgetPath(scope, `/expense-limits/${limitId}`));
  };
}

export const expenseLimitsApi = new ExpenseLimitsApi();
