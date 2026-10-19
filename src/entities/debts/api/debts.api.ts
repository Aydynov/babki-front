import { z } from 'zod';
import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { groupRepaymentSchema } from '@/entities/debt-transactions/@x/debts';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import {
  type CreateDebtDto,
  type CreateGroupDebtDto,
  type UpdateGroupDebtDto,
  createGroupDebtSchema,
  updateGroupDebtSchema,
  repayGroupDebtSchema,
  groupDebtSchema,
  groupDebtsPaginatedResponseSchema,
  createDebtSchema,
  debtSchema,
  debtsPaginatedResponseSchema,
  type ListDebtsQuery,
  listDebtsQuerySchema,
  type RepayDebtDto,
  repayDebtSchema,
  type UpdateDebtDto,
  updateDebtSchema,
} from '../model/schemas';

class DebtsApi {
  private readonly client = apiClient;

  async create(payload: CreateDebtDto | CreateGroupDebtDto, scope?: BudgetScope) {
    const body = (scope?.kind === 'group' ? createGroupDebtSchema : createDebtSchema).parse(payload);
    const response = await this.client.post(budgetPath(scope, '/debts'), body);

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupDebtSchema : debtSchema, response.data);
  }

  async findAll(query: ListDebtsQuery = {}, signal?: AbortSignal, scope?: BudgetScope) {
    const querySchema = scope?.kind === 'group'
      ? listDebtsQuerySchema : listDebtsQuerySchema.omit({ includeArchived: true });
    const params = querySchema.parse(query);
    const response = await this.client.get(budgetPath(scope, '/debts'), { params, signal });

    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupDebtsPaginatedResponseSchema : debtsPaginatedResponseSchema,
      response.data,
    );
  }

  async findOne(debtId: string, signal?: AbortSignal, scope?: BudgetScope) {
    const response = await this.client.get(budgetPath(scope, `/debts/${debtId}`), { signal });

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupDebtSchema : debtSchema, response.data);
  }

  async update(debtId: string, payload: UpdateDebtDto | UpdateGroupDebtDto, scope?: BudgetScope) {
    const body = (scope?.kind === 'group' ? updateGroupDebtSchema : updateDebtSchema).parse(payload);
    const response = await this.client.patch(budgetPath(scope, `/debts/${debtId}`), body);

    return parseRequiredWithSchema(scope?.kind === 'group' ? groupDebtSchema : debtSchema, response.data);
  }

  async repay(debtId: string, payload: RepayDebtDto, scope?: BudgetScope) {
    const body = (scope?.kind === 'group' ? repayGroupDebtSchema : repayDebtSchema).parse(payload);
    const response = await this.client.post(
      budgetPath(scope, `/debts/${debtId}/repayments`),
      body,
    );

    return scope?.kind === 'group'
      ? z.object({ debt: groupDebtSchema, repayment: groupRepaymentSchema }).parse(response.data)
      : parseRequiredWithSchema(debtSchema, response.data);
  }

  async remove(debtId: string, scope?: BudgetScope) {
    await this.client.delete(budgetPath(scope, `/debts/${debtId}`));
  }

  async archive(debtId: string, scope?: BudgetScope) {
    await this.client.post(budgetPath(scope, `/debts/${debtId}/archive`));
  }

  async cancelRepayment(debtId: string, repaymentId: string, scope?: BudgetScope) {
    const response = await this.client.post(budgetPath(scope, `/debts/${debtId}/repayments/${repaymentId}/cancel`));
    return z.object({ debt: groupDebtSchema, repayment: groupRepaymentSchema }).parse(response.data);
  }
}

export const debtsApi = new DebtsApi();
