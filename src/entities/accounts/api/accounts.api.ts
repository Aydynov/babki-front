import { transactionsApi } from '@/entities/transactions/@x/accounts';
import type { BudgetScope } from '@/shared/types';
import { budgetPath } from '@/shared/lib/budget-api';
import { apiClient, parseRequiredWithSchema } from '@/shared/api';
import { calculateHistoricalBalance, loadCompleteLedger } from '../model/budget-ledger';
import {
  accountSchema,
  groupAccountSchema,
  createAccountSchema,
  type CreateAccountDto,
  findAccountByQuerySchema,
  type FindAccountByQuery,
  renameAccountSchema,
  type RenameAccountDto,
} from '../model/schemas';

class AccountsApi {
  private readonly client = apiClient;

  async findAll(query: FindAccountByQuery = {}, scope?: BudgetScope, signal?: AbortSignal) {
    const params = findAccountByQuerySchema.parse(query);
    if (scope?.kind === 'group') delete params.toDate;
    const response = await this.client.get(budgetPath(scope, '/accounts'), {
      params,
      signal,
    });
    const accounts = parseRequiredWithSchema(
      (scope?.kind === 'group' ? groupAccountSchema : accountSchema).array(),
      response.data,
    );
    if (scope?.kind !== 'group' || !query.toDate) return accounts;
    const toDate = `${query.toDate.slice(0, 10)}T23:59:59.999Z`;
    return Promise.all(
      accounts.map(async (account) => {
        const rows = await loadCompleteLedger((pagination) => transactionsApi.findAll(
          {
            ...pagination,
            accountId: account._id,
            toDate,
          },
          scope,
          signal,
        ));
        return { ...account, amount: calculateHistoricalBalance(account, rows, toDate) };
      }),
    );
  }

  async create(payload: CreateAccountDto, scope?: BudgetScope, _signal?: AbortSignal) {
    const body = createAccountSchema.parse(payload);
    const response = await this.client.post(budgetPath(scope, '/accounts'), body);
    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupAccountSchema : accountSchema,
      response.data,
    );
  }

  async findOne(accountId: string, scope?: BudgetScope, signal?: AbortSignal) {
    const response = await this.client.get(budgetPath(scope, `/accounts/${accountId}`), { signal });
    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupAccountSchema : accountSchema,
      response.data,
    );
  }

  async rename(
    accountId: string,
    payload: RenameAccountDto,
    scope?: BudgetScope,
    _signal?: AbortSignal,
  ) {
    const body = renameAccountSchema.parse(payload);
    const response = await this.client.patch(budgetPath(scope, `/accounts/${accountId}`), body);
    return parseRequiredWithSchema(
      scope?.kind === 'group' ? groupAccountSchema : accountSchema,
      response.data,
    );
  }

  async archive(accountId: string, scope?: BudgetScope, _signal?: AbortSignal) {
    await this.client.post(budgetPath(scope, `/accounts/${accountId}/archive`));
  }

  async remove(accountId: string, scope?: BudgetScope, _signal?: AbortSignal) {
    await this.client.delete(budgetPath(scope, `/accounts/${accountId}`));
  }

  delete = this.remove.bind(this);
}

export const accountsApi = new AccountsApi();
