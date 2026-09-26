import type { ExpensesPaginatedResponse } from '@/entities/expenses/@x/expense-limits';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  createExpenseLimitSchema,
  type CreateExpenseLimitDto,
  expenseLimitSchema,
  type UpdateExpenseLimitDto,
  updateExpenseLimitSchema,
  type ExpenseLimit,
  type FindExpenseLimitQuery,
} from '../model/schemas';

class ExpenseLimitsApi {
  private readonly client = apiClient;

  create = async (payload: CreateExpenseLimitDto) => {
    const body = createExpenseLimitSchema.parse(payload);
    const response = await this.client.post<ExpenseLimit>('/expense-limits', body);
    return parseRequiredWithSchema(expenseLimitSchema, response.data);
  };

  findAll = async (params: FindExpenseLimitQuery) => {
    const response = await this.client.get<ExpensesPaginatedResponse>('/expense-limits', { params });
    return parseRequiredWithSchema(expenseLimitSchema.array(), response.data);
  };

  findOne = async (limitId: string) => {
    const response = await this.client.get<ExpenseLimit>(`/expense-limits/${limitId}`);
    return parseRequiredWithSchema(expenseLimitSchema, response.data);
  };

  update = async (limitId: string, payload: UpdateExpenseLimitDto) => {
    const body = updateExpenseLimitSchema.parse(payload);
    const response = await this.client.patch<ExpenseLimit>(
      `/expense-limits/${limitId}`,
      body,
    );
    return parseRequiredWithSchema(expenseLimitSchema, response.data);
  };

  delete = async (limitId: string) => {
    await this.client.delete(`/expense-limits/${limitId}`);
  };
}

export const expenseLimitsApi = new ExpenseLimitsApi();
