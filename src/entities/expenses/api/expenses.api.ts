import { z } from 'zod';
import { expenseCategoriesApi } from '@/entities/expense-categories/@x/expenses';
import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateExpenseDto,
  createExpenseSchema,
  type Expense,
  type ExpenseRevenue,
  expenseRevenueSchema,
  expenseSchema,
  type ExpensesPaginatedResponse,
  expensesPaginatedResponseSchema,
  type ListExpensesQuery,
  listExpensesQuerySchema,
  type UpdateExpenseDto,
  updateExpenseSchema,
} from '../model/schemas';

class ExpensesApi {
  private static normalize = async (value: unknown, scope: BudgetScope, signal?: AbortSignal) => {
    const record = z
      .object({ category: z.string().regex(/^[a-f\d]{24}$/i) })
      .passthrough()
      .parse(value);
    const category = await expenseCategoriesApi
      .findOne(record.category, scope, signal)
      .catch((error: unknown) => {
        if (signal?.aborted) throw error;
        return null;
      });
    return {
      ...record,
      categoryUnavailable: !category,
      category: category ?? {
        _id: record.category,
        spaceId: scope.spaceId,
        name: 'Категория недоступна',
        isArchived: true,
        createdAt: '1970-01-01',
        updatedAt: '1970-01-01',
      },
    };
  };

  private readonly client = apiClient;

  create = async (
    payload: CreateExpenseDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = createExpenseSchema
      .extend({ amount: z.number().positive() })
      .parse(payload);
    const response = await this.client.post<Expense>(
      budgetPath(scope, '/expenses'),
      body,
    );

    return parseRequiredWithSchema(
      expenseSchema,
      await ExpensesApi.normalize(response.data, scope),
    );
  };

  findAll = async (
    query: ListExpensesQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpensesPaginatedResponse>(
      budgetPath(scope, '/expenses'),
      {
        params: utcPeriod(params),
        signal,
      },
    );

    const data = {
      ...response.data,
      items: await Promise.all(
        response.data.items.map((item) => ExpensesApi.normalize(item, scope, signal)),
      ),
    };
    return parseRequiredWithSchema(expensesPaginatedResponseSchema, data);
  };

  findTotalRevenue = async (
    query: ListExpensesQuery,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpenseRevenue>(
      budgetPath(scope, '/expenses/revenue'),
      {
        params: utcPeriod(params),
        signal,
      },
    );
    return parseRequiredWithSchema(expenseRevenueSchema, response.data);
  };

  findOne = async (
    expenseId: string,
    scope: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const response = await this.client.get<Expense>(
      budgetPath(scope, `/expenses/${expenseId}`),
      {
        signal,
      },
    );

    return parseRequiredWithSchema(
      expenseSchema,
      await ExpensesApi.normalize(response.data, scope, signal),
    );
  };

  update = async (
    expenseId: string,
    payload: UpdateExpenseDto,
    scope: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = updateExpenseSchema
      .extend({ amount: z.number().positive().optional() })
      .parse(payload);
    const response = await this.client.patch<Expense>(
      budgetPath(scope, `/expenses/${expenseId}`),
      body,
    );

    return parseRequiredWithSchema(
      expenseSchema,
      await ExpensesApi.normalize(response.data, scope),
    );
  };
}

export const expensesApi = new ExpensesApi();
