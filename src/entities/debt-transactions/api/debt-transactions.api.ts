import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type DebtTransaction,
  type GroupRepayment,
  debtTransactionSchema,
  groupRepaymentSchema,
  groupRepaymentsPaginatedResponseSchema,
  debtTransactionsPaginatedResponseSchema,
  type ListDebtTransactionsQuery,
  listDebtTransactionsQuerySchema,
} from '../model/schemas';

class DebtTransactionsApi {
  private readonly client = apiClient;

  async findAll(
    debtId: string,
    query: ListDebtTransactionsQuery = {},
    signal?: AbortSignal,
    scope?: BudgetScope,
  ): Promise<{ items: (DebtTransaction | GroupRepayment)[]; total: number; page: number; limit: number }> {
    const params = listDebtTransactionsQuerySchema.parse(query);
    const response = await this.client.get(
      budgetPath(scope, `/debts/${debtId}/${scope?.kind === 'group' ? 'repayments' : 'transactions'}`),
      { params, signal },
    );

    return parseRequiredWithSchema(scope?.kind === 'group'
      ? groupRepaymentsPaginatedResponseSchema : debtTransactionsPaginatedResponseSchema, response.data);
  }

  async findOne(debtId: string, debtTransactionId: string, signal?: AbortSignal, scope?: BudgetScope) {
    const collection = scope?.kind === 'group' ? 'repayments' : 'transactions';
    const response = await this.client.get(
      budgetPath(scope, `/debts/${debtId}/${collection}/${debtTransactionId}`),
      { signal },
    );

    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupRepaymentSchema : debtTransactionSchema,
      response.data,
    );
  }
}

export const debtTransactionsApi = new DebtTransactionsApi();
