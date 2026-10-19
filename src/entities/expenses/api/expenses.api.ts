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
  private static normalize = async (value: unknown, scope?: BudgetScope) => {
    const record = z
      .object({ category: z.string().regex(/^[a-f\d]{24}$/i) })
      .passthrough()
      .parse(value);
    const category = await expenseCategoriesApi.findOne(record.category, scope).catch(() => null);
    return {
      ...record,
      categoryUnavailable: !category,
      category: category ?? {
        _id: record.category,
        name: 'Категория недоступна',
        isArchived: true,
        createdAt: '1970-01-01',
        updatedAt: '1970-01-01',
      },
    };
  };

  private readonly client = apiClient;

  create = async (payload: CreateExpenseDto, scope?: BudgetScope, _signal?: AbortSignal) => {
    const body = (
      scope?.kind === 'group'
        ? createExpenseSchema.extend({ amount: z.number().positive() })
        : createExpenseSchema
    ).parse(payload);
    const response = await this.client.post<Expense>(budgetPath(scope, '/expenses'), body);

    return parseRequiredWithSchema(
      expenseSchema,
      scope?.kind === 'group' ? await ExpensesApi.normalize(response.data, scope) : response.data,
    );
  };

  findAll = async (query: ListExpensesQuery = {}, scope?: BudgetScope, signal?: AbortSignal) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpensesPaginatedResponse>(
      budgetPath(scope, '/expenses'),
      {
        params: scope?.kind === 'group' ? utcPeriod(params) : params,
        signal,
      },
    );

    const data = scope?.kind === 'group'
      ? {
        ...response.data,
        items: await Promise.all(
          response.data.items.map((item) => ExpensesApi.normalize(item, scope)),
        ),
      }
      : response.data;
    return parseRequiredWithSchema(expensesPaginatedResponseSchema, data);
  };

  findTotalRevenue = async (
    query: ListExpensesQuery = {},
    scope?: BudgetScope,
    signal?: AbortSignal,
  ) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpenseRevenue>(budgetPath(scope, '/expenses/revenue'), {
      params: scope?.kind === 'group' ? utcPeriod(params) : params,
      signal,
    });
    return parseRequiredWithSchema(expenseRevenueSchema, response.data);
  };

  findOne = async (expenseId: string, scope?: BudgetScope, signal?: AbortSignal) => {
    const response = await this.client.get<Expense>(budgetPath(scope, `/expenses/${expenseId}`), {
      signal,
    });

    return parseRequiredWithSchema(
      expenseSchema,
      scope?.kind === 'group' ? await ExpensesApi.normalize(response.data, scope) : response.data,
    );
  };

  update = async (
    expenseId: string,
    payload: UpdateExpenseDto,
    scope?: BudgetScope,
    _signal?: AbortSignal,
  ) => {
    const body = (
      scope?.kind === 'group'
        ? updateExpenseSchema.extend({ amount: z.number().positive().optional() })
        : updateExpenseSchema
    ).parse(payload);
    const response = await this.client.patch<Expense>(
      budgetPath(scope, `/expenses/${expenseId}`),
      body,
    );

    return parseRequiredWithSchema(
      expenseSchema,
      scope?.kind === 'group' ? await ExpensesApi.normalize(response.data, scope) : response.data,
    );
  };
}

export const expensesApi = new ExpensesApi();
