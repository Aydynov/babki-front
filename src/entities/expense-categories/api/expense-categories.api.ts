import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseWithSchema } from '@/shared/api';
import {
  createExpenseCategorySchema,
  type CreateExpenseCategoryDto,
  expenseCategorySchema,
  type UpdateExpenseCategoryDto,
  updateExpenseCategorySchema,
} from '../model/schemas';

class ExpenseCategoriesApi {
  private readonly client = apiClient;

  async create(payload: CreateExpenseCategoryDto, scope?: BudgetScope, _signal?: AbortSignal) {
    const body = createExpenseCategorySchema.parse(payload);
    const response = await this.client.post(budgetPath(scope, '/expense-categories'), body);

    return parseWithSchema(expenseCategorySchema, response.data);
  }

  async findAll(scope?: BudgetScope, signal?: AbortSignal) {
    const response = await this.client.get(budgetPath(scope, '/expense-categories'), { signal });

    return parseWithSchema(expenseCategorySchema.array(), response.data);
  }

  async findOne(categoryId: string, scope?: BudgetScope, signal?: AbortSignal) {
    const response = await this.client.get(budgetPath(scope, `/expense-categories/${categoryId}`), {
      signal,
    });

    return parseWithSchema(expenseCategorySchema, response.data);
  }

  async update(
    categoryId: string,
    payload: UpdateExpenseCategoryDto,
    scope?: BudgetScope,
    _signal?: AbortSignal,
  ) {
    const body = updateExpenseCategorySchema.parse(payload);
    const response = await this.client.patch(
      budgetPath(scope, `/expense-categories/${categoryId}`),
      body,
    );

    return parseWithSchema(expenseCategorySchema, response.data);
  }

  async remove(categoryId: string, scope?: BudgetScope, _signal?: AbortSignal) {
    await this.client.delete(budgetPath(scope, `/expense-categories/${categoryId}`));
  }
}

export const expenseCategoriesApi = new ExpenseCategoriesApi();
