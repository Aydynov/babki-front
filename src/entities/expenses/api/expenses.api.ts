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
  private readonly client = apiClient;

  create = async (payload: CreateExpenseDto) => {
    const body = createExpenseSchema.parse(payload);
    const response = await this.client.post<Expense>('/expenses', body);

    return parseRequiredWithSchema(expenseSchema, response.data);
  };

  findAll = async (query: ListExpensesQuery = {}) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpensesPaginatedResponse>('/expenses', { params });

    return parseRequiredWithSchema(expensesPaginatedResponseSchema, response.data);
  };

  findTotalRevenue = async (query: ListExpensesQuery = {}) => {
    const params = listExpensesQuerySchema.parse(query);
    const response = await this.client.get<ExpenseRevenue>('/expenses/revenue', { params });
    return parseRequiredWithSchema(expenseRevenueSchema, response.data);
  };

  findOne = async (expenseId: string) => {
    const response = await this.client.get<Expense>(`/expenses/${expenseId}`);

    return parseRequiredWithSchema(expenseSchema, response.data);
  };

  update = async (expenseId: string, payload: UpdateExpenseDto) => {
    const body = updateExpenseSchema.parse(payload);
    const response = await this.client.patch<Expense>(`/expenses/${expenseId}`, body);

    return parseRequiredWithSchema(expenseSchema, response.data);
  };
}

export const expensesApi = new ExpensesApi();
