import type { BudgetScope } from '@/shared/types';
import { budgetPath, utcPeriod } from '@/shared/lib/budget-api';
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

  async findAll(query: ListTransactionsQuery = {}, scope?: BudgetScope, signal?: AbortSignal) {
    const params = listTransactionsQuerySchema.parse(query);
    const response = await this.client.get<TransactionsPaginatedResponse>(
      budgetPath(scope, '/transactions'),
      {
        params: scope?.kind === 'group' ? utcPeriod(params) : params,
        signal,
      },
    );
    return parseRequiredWithSchema(transactionsPaginatedResponseSchema, response.data);
  }

  async findOne(transactionId: string, scope?: BudgetScope, signal?: AbortSignal) {
    const response = await this.client.get<Transaction>(
      budgetPath(scope, `/transactions/${transactionId}`),
      { signal },
    );
    return parseRequiredWithSchema(transactionSchema, response.data);
  }

  async delete(transactionId: string, scope?: BudgetScope, transactionType?: 'income' | 'expense') {
    if (scope?.kind === 'group') {
      if (!transactionType) throw new Error('Не указан тип операции');
      await this.client.delete(
        budgetPath(
          scope,
          `/${transactionType === 'income' ? 'incomes' : 'expenses'}/${transactionId}`,
        ),
      );
      return;
    }
    await this.client.delete(`/transactions/${transactionId}`);
  }
}

export const transactionsApi = new TransactionsApi();
