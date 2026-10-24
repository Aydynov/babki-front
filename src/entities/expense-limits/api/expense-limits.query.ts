import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/expense-limits';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget, isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { expenseLimitsApi } from './expense-limits.api';
import type {
  ExpenseLimit,
  CreateExpenseLimitDto,
  FindExpenseLimitQuery,
  UpdateExpenseLimitDto,
} from '../model/schemas';

export const expenseLimitsQueryKeys = {
  all: ['expense-limits'] as const,
  listAll: () => [...expenseLimitsQueryKeys.all, 'list'] as const,
  list: (query: FindExpenseLimitQuery) => [...expenseLimitsQueryKeys.listAll(), query] as const,
  details: () => [...expenseLimitsQueryKeys.all, 'detail'] as const,
  detail: (limitId: string) => [...expenseLimitsQueryKeys.details(), limitId] as const,
};

export const expenseLimitsQueryOptions = {
  findAll: (query: FindExpenseLimitQuery, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseLimitsQueryKeys.list(query)),
    queryFn: ({ signal }) => expenseLimitsApi.findAll(query, scope, signal),
  }),
  findOne: (limitId: string, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseLimitsQueryKeys.detail(limitId)),
    queryFn: ({ signal }) => expenseLimitsApi.findOne(limitId, scope, signal),
  }),
};

export const useExpenseLimitsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: FindExpenseLimitQuery) => expenseLimitsQueryOptions.findAll(query, scope),
    findOne: (limitId: string) => expenseLimitsQueryOptions.findOne(limitId, scope),
  };
};

const cacheLimit = async (client: QueryClient, scope: BudgetScope, limit: ExpenseLimit | string) => {
  await client.cancelQueries({ queryKey: scopedKey(scope, expenseLimitsQueryKeys.all) });
  if (!isActiveBudgetIdentity(client, scope)) return;
  const id = typeof limit === 'string' ? limit : limit._id;
  client.getQueriesData<ExpenseLimit[]>({ queryKey: scopedKey(scope, expenseLimitsQueryKeys.listAll()) })
    .forEach(([key, rows]) => {
      if (!rows) return;
      const params = key.at(-1) as FindExpenseLimitQuery;
      const matches = typeof limit !== 'string'
        && (!params.currency || params.currency === limit.currency)
        && (!params.categoryId || params.categoryId === limit.category._id)
        && params.periodDate.slice(0, 10) >= limit.startDate.slice(0, 10)
        && params.periodDate.slice(0, 10) <= limit.endDate.slice(0, 10);
      const existing = rows.some((row) => row._id === id);
      const next = matches
        ? existing ? rows.map((row) => (row._id === id ? limit : row)) : [...rows, limit]
        : rows.filter((row) => row._id !== id);
      client.setQueryData(key, next);
    });
  const detailKey = expenseLimitsQueryOptions.findOne(id, scope).queryKey;
  if (typeof limit === 'string') client.removeQueries({ queryKey: detailKey, exact: true });
  else client.setQueryData(detailKey, limit);
  invalidateBudget(client, scope).catch(() => undefined);
};

export const useCreateExpenseLimitMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ payload }: { payload: CreateExpenseLimitDto }) => expenseLimitsApi.create(payload, scope),
    onSuccess: (limit) => cacheLimit(client, scope, limit),
  });
};

export const useUpdateExpenseLimitMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      limitId,
      payload,
    }: {
      limitId: string;
      payload: UpdateExpenseLimitDto;
    }) => expenseLimitsApi.update(limitId, payload, scope),
    onSuccess: (limit) => cacheLimit(client, scope, limit),
  });
};

export const useDeleteExpenseLimitMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (limitId: string) => expenseLimitsApi.delete(limitId, scope),
    onSuccess: (_, limitId) => cacheLimit(client, scope, limitId),
  });
};
