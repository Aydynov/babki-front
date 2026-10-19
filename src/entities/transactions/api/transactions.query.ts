import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/transactions';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { loadPaginatedHistory, sortHistory } from '@/shared/lib/paginated-history';
import { transactionsApi } from './transactions.api';
import type { ListTransactionsQuery } from '../model/schemas';

type AccountHistoryQuery = Pick<ListTransactionsQuery, 'accountId' | 'fromDate' | 'toDate'>;

export const transactionsQueryKeys = {
  all: ['transactions'] as const,
  listAll: () => [...transactionsQueryKeys.all, 'list'] as const,
  list: (query: ListTransactionsQuery) => [...transactionsQueryKeys.listAll(), query] as const,
  details: () => [...transactionsQueryKeys.all, 'detail'] as const,
  detail: (transactionId: string) => [...transactionsQueryKeys.details(), transactionId] as const,
};

export const transactionsQueryOptions = {
  findAll: (query: ListTransactionsQuery = {}, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, transactionsQueryKeys.list(query)),
    queryFn: ({ signal }) => transactionsApi.findAll(query, scope, signal),
  }),
  findOne: (transactionId: string, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, transactionsQueryKeys.detail(transactionId)),
    queryFn: ({ signal }) => transactionsApi.findOne(transactionId, scope, signal),
  }),
  accountHistory: (
    query: AccountHistoryQuery,
    scope?: BudgetScope,
  ) => queryOptions({
    queryKey: scopedKey(scope, ['transactions', 'account-history', query]),
    queryFn: async ({ signal }) => {
      const lists = await Promise.all(
        (['income', 'expense'] as const).map((transactionType) => loadPaginatedHistory(
          (pagination) => transactionsApi.findAll(
            { ...query, ...pagination, transactionType },
            scope,
            signal,
          ),
        )),
      );
      return sortHistory(lists.flat()).filter((item) => item.type !== 'transfer');
    },
  }),
};

export const useTransactionsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListTransactionsQuery = {}) => transactionsQueryOptions.findAll(query, scope),
    findOne: (transactionId: string) => transactionsQueryOptions.findOne(transactionId, scope),
    accountHistory: (query: AccountHistoryQuery) => transactionsQueryOptions.accountHistory(
      query,
      scope,
    ),
  };
};

export const useDeleteTransactionMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      transactionId,
      transactionType,
    }: {
      transactionId: string;
      transactionType?: 'income' | 'expense';
    }) => transactionsApi.delete(transactionId, scope, transactionType),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
