import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  transactionSchema,
  transactionsPaginatedResponseSchema,
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type TransactionsPaginatedResponse,
  type Transaction,
} from '../model/schemas';

class TransactionsApi {
  private readonly client = apiClient;

  async findAll(query: ListTransactionsQuery = {}) {
    const params = listTransactionsQuerySchema.parse(query);
    const response = await this.client.get<TransactionsPaginatedResponse>('/transactions', { params });
    return parseRequiredWithSchema(transactionsPaginatedResponseSchema, response.data);
  }

  async findOne(transactionId: string) {
    const response = await this.client.get<Transaction>(`/transactions/${transactionId}`);
    return parseRequiredWithSchema(transactionSchema, response.data);
  }

  async delete(transactionId: string) {
    await this.client.delete(`/transactions/${transactionId}`);
  }
}

export const transactionsApi = new TransactionsApi();
