import { useBudgetScope } from '@/entities/budgets/@x/debt-transactions';
import type { BudgetScope } from '@/shared/types';
import { scopedKey } from '@/shared/lib/budget-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { debtTransactionsApi } from './debt-transactions.api';
import type { ListDebtTransactionsQuery } from '../model/schemas';

export const debtTransactionsQueryKeys = {
  all: ['debt-transactions'] as const,
  lists: (id: string, scope?: BudgetScope) => [...scopedKey(scope, ['debt-transactions']), id, 'list'] as const,
  list: (id: string, query: ListDebtTransactionsQuery, scope?: BudgetScope) => (
    [...debtTransactionsQueryKeys.lists(id, scope), query] as const
  ),
  detail: (id: string, transactionId: string, scope?: BudgetScope) => (
    [...scopedKey(scope, ['debt-transactions']), id, 'detail', transactionId] as const
  ),
};

export const debtTransactionsQueryOptions = {
  findAll: (
    debtId: string,
    query: ListDebtTransactionsQuery = {},
    scope?: BudgetScope,
  ) => queryOptions({
    queryKey: debtTransactionsQueryKeys.list(debtId, query, scope),
    queryFn: ({ signal }) => debtTransactionsApi.findAll(debtId, query, signal, scope),
  }),
  findOne: (debtId: string, transactionId: string, scope?: BudgetScope) => queryOptions({
    queryKey: debtTransactionsQueryKeys.detail(debtId, transactionId, scope),
    queryFn: ({ signal }) => debtTransactionsApi.findOne(debtId, transactionId, signal, scope),
  }),
};

export const useDebtTransactionsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (id: string, query: ListDebtTransactionsQuery = {}) => (
      debtTransactionsQueryOptions.findAll(id, query, scope)
    ),
    findOne: (id: string, transactionId: string) => debtTransactionsQueryOptions.findOne(id, transactionId, scope),
  };
};

export const useDebtTransactionsListQuery = (id: string, query: ListDebtTransactionsQuery = {}) => (
  useQuery(useDebtTransactionsQueryOptions().findAll(id, query))
);
export const useDebtTransactionQuery = (id: string, transactionId: string) => (
  useQuery(useDebtTransactionsQueryOptions().findOne(id, transactionId))
);
