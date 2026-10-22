import { z } from 'zod';
import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { debtTransactionSchema } from '@/entities/debt-transactions/@x/debts';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateDebtDto,
  type UpdateDebtDto,
  createDebtSchema,
  updateDebtSchema,
  repayDebtSchema,
  debtSchema,
  debtsPaginatedResponseSchema,
  type ListDebtsQuery,
  listDebtsQuerySchema,
  type RepayDebtDto,
} from '../model/schemas';

class DebtsApi {
  private readonly client = apiClient;

  async create(payload: CreateDebtDto, scope: BudgetScope) {
    const body = createDebtSchema.parse(payload);
    const response = await this.client.post(budgetPath(scope, '/debts'), body);

    return parseRequiredWithSchema(debtSchema, response.data);
  }

  async findAll(
    query: ListDebtsQuery,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ) {
    const querySchema = listDebtsQuerySchema;
    const parsed = querySchema.parse(query);
    const params = {
      ...parsed,
      includeArchived:
        parsed.includeArchived === undefined
          ? undefined
          : String(parsed.includeArchived),
    };
    const response = await this.client.get(budgetPath(scope, '/debts'), {
      params,
      signal,
    });

    return parseRequiredWithSchema(debtsPaginatedResponseSchema, response.data);
  }

  async findOne(
    debtId: string,
    signal: AbortSignal | undefined,
    scope: BudgetScope,
  ) {
    const response = await this.client.get(
      budgetPath(scope, `/debts/${debtId}`),
      { signal },
    );

    return parseRequiredWithSchema(debtSchema, response.data);
  }

  async update(debtId: string, payload: UpdateDebtDto, scope: BudgetScope) {
    const body = updateDebtSchema.parse(payload);
    const response = await this.client.patch(
      budgetPath(scope, `/debts/${debtId}`),
      body,
    );

    return parseRequiredWithSchema(debtSchema, response.data);
  }

  async repay(debtId: string, payload: RepayDebtDto, scope: BudgetScope) {
    const body = repayDebtSchema.parse(payload);
    const response = await this.client.post(
      budgetPath(scope, `/debts/${debtId}/repayments`),
      body,
    );

    return z
      .object({ debt: debtSchema, repayment: debtTransactionSchema })
      .parse(response.data);
  }

  async remove(debtId: string, scope: BudgetScope) {
    await this.client.delete(budgetPath(scope, `/debts/${debtId}`));
  }

  async archive(debtId: string, scope: BudgetScope) {
    await this.client.post(budgetPath(scope, `/debts/${debtId}/archive`));
  }

  async cancelRepayment(
    debtId: string,
    repaymentId: string,
    scope: BudgetScope,
  ) {
    const response = await this.client.post(
      budgetPath(scope, `/debts/${debtId}/repayments/${repaymentId}/cancel`),
    );
    return z
      .object({ debt: debtSchema, repayment: debtTransactionSchema })
      .parse(response.data);
  }
}

export const debtsApi = new DebtsApi();
