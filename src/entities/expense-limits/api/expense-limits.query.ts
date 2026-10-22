import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/expense-limits';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { expenseLimitsApi } from './expense-limits.api';
import type {
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

export const useCreateExpenseLimitMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ payload }: { payload: CreateExpenseLimitDto }) => expenseLimitsApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
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
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useDeleteExpenseLimitMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (limitId: string) => expenseLimitsApi.delete(limitId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
