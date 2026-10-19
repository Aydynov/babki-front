import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/incomes';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { loadPaginatedHistory } from '@/shared/lib/paginated-history';
import { incomesApi } from './incomes.api';
import type { CreateIncomeDto, ListIncomesQuery, UpdateIncomeDto } from '../model/schemas';

export const incomesQueryKeys = {
  all: ['incomes'] as const,
  listAll: () => [...incomesQueryKeys.all, 'list'] as const,
  list: (query: ListIncomesQuery) => [...incomesQueryKeys.listAll(), query] as const,
  totalRevenue: (query: ListIncomesQuery) => [...incomesQueryKeys.listAll(), query, 'totalRevenue'] as const,
  details: () => [...incomesQueryKeys.all, 'detail'] as const,
  detail: (incomeId: string) => [...incomesQueryKeys.details(), incomeId] as const,
};

export const incomesQueryOptions = {
  findAll: (query: ListIncomesQuery = {}, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, incomesQueryKeys.list(query)),
    queryFn: ({ signal }) => incomesApi.findAll(query, scope, signal),
  }),
  findOne: (incomeId: string, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, incomesQueryKeys.detail(incomeId)),
    queryFn: ({ signal }) => incomesApi.findOne(incomeId, scope, signal),
  }),
  findTotalRevenue: (query: ListIncomesQuery = {}, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, incomesQueryKeys.totalRevenue(query)),
    queryFn: ({ signal }) => incomesApi.findTotalRevenue(query, scope, signal),
  }),
  currencyHistory: (
    query: Pick<ListIncomesQuery, 'accountId' | 'fromDate' | 'toDate' | 'currency'>,
    scope?: BudgetScope,
  ) => queryOptions({
    queryKey: scopedKey(scope, [...incomesQueryKeys.listAll(), 'currency-history', query]),
    queryFn: ({ signal }) => loadPaginatedHistory(
      (pagination) => incomesApi.findAll({ ...query, ...pagination }, scope, signal),
    ),
  }),
};

export const useIncomesQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListIncomesQuery = {}) => incomesQueryOptions.findAll(query, scope),
    findOne: (incomeId: string) => incomesQueryOptions.findOne(incomeId, scope),
    findTotalRevenue: (query: ListIncomesQuery = {}) => incomesQueryOptions.findTotalRevenue(query, scope),
    currencyHistory: (
      query: Pick<ListIncomesQuery, 'accountId' | 'fromDate' | 'toDate' | 'currency'>,
    ) => incomesQueryOptions.currencyHistory(query, scope),
  };
};

export const useCreateIncomeMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload: CreateIncomeDto) => incomesApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useUpdateIncomeMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ incomeId, payload }: { incomeId: string; payload: UpdateIncomeDto }) => incomesApi.update(
      incomeId,
      payload,
      scope,
    ),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
