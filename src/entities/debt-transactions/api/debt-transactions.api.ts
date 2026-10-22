import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type DebtTransaction,
  debtTransactionSchema,
  debtTransactionsPaginatedResponseSchema,
  type ListDebtTransactionsQuery,
  listDebtTransactionsQuerySchema,
} from '../model/schemas';

class DebtTransactionsApi {
  private readonly client = apiClient;

  async findAll(
    debtId: string,
    query: ListDebtTransactionsQuery,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ): Promise<{
    items: DebtTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = listDebtTransactionsQuerySchema.parse(query);
    const response = await this.client.get(
      budgetPath(scope, `/debts/${debtId}/repayments`),
      {
        params,
        signal,
      },
    );

    return parseRequiredWithSchema(
      debtTransactionsPaginatedResponseSchema,
      response.data,
    );
  }

  async findOne(
    debtId: string,
    debtTransactionId: string,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ) {
    const collection = 'repayments';
    const response = await this.client.get(
      budgetPath(scope, `/debts/${debtId}/${collection}/${debtTransactionId}`),
      { signal },
    );

    return parseRequiredWithSchema(debtTransactionSchema, response.data);
  }
}

export const debtTransactionsApi = new DebtTransactionsApi();
