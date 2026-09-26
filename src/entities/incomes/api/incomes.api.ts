import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateIncomeDto,
  createIncomeSchema,
  type Income,
  type IncomeRevenue,
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

  create = async (payload: CreateIncomeDto) => {
    const body = createIncomeSchema.parse(payload);
    const response = await this.client.post<Income>('/incomes', body);

    return parseRequiredWithSchema(incomeSchema, response.data);
  };

  findAll = async (query: ListIncomesQuery = {}) => {
    const params = listIncomesQuerySchema.parse(query);
    const response = await this.client.get<IncomesPaginatedResponse>('/incomes', { params });

    return parseRequiredWithSchema(incomesPaginatedResponseSchema, response.data);
  };

  findTotalRevenue = async (query: ListIncomesQuery = {}) => {
    const params = listIncomesQuerySchema.parse(query);
    const response = await this.client.get<IncomeRevenue>('/incomes/revenue', { params });

    return parseRequiredWithSchema(incomeRevenueSchema, response.data);
  };

  findOne = async (incomeId: string) => {
    const response = await this.client.get<Income>(`/incomes/${incomeId}`);

    return parseRequiredWithSchema(incomeSchema, response.data);
  };

  update = async (incomeId: string, payload: UpdateIncomeDto) => {
    const body = updateIncomeSchema.parse(payload);
    const response = await this.client.patch<Income>(`/incomes/${incomeId}`, body);

    return parseRequiredWithSchema(incomeSchema, response.data);
  };
}

export const incomesApi = new IncomesApi();
