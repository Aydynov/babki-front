import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/expense-categories';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget, isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { queryClient } from '@/shared/lib/query-client';
import { expenseCategoriesApi } from './expense-categories.api';
import type {
  ExpenseCategory,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from '../model/schemas';

export const expenseCategoriesQueryKeys = {
  all: ['expense-categories'] as const,
  lists: () => [...expenseCategoriesQueryKeys.all, 'list'] as const,
  details: () => [...expenseCategoriesQueryKeys.all, 'detail'] as const,
  detail: (categoryId: string) => [...expenseCategoriesQueryKeys.details(), categoryId] as const,
};

export const expenseCategoriesQueryOptions = {
  findAll: (scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseCategoriesQueryKeys.lists()),
    queryFn: ({ signal }) => expenseCategoriesApi.findAll(scope, signal),
  }),
  findOne: (categoryId: string, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseCategoriesQueryKeys.detail(categoryId)),
    queryFn: ({ signal }) => expenseCategoriesApi.findOne(categoryId, scope, signal),
  }),
};

export const resolveExpenseCategory = async (categoryId: string, scope: BudgetScope, signal?: AbortSignal) => {
  signal?.throwIfAborted();
  // Category requests share their query signal; cancelling one expense must not cancel other consumers.
  const categories = await queryClient.fetchQuery({
    ...expenseCategoriesQueryOptions.findAll(scope),
    retry: false,
  }).catch(() => []);
  signal?.throwIfAborted();
  const category = categories.find(({ _id }) => _id === categoryId)
    ?? await queryClient.fetchQuery({
      ...expenseCategoriesQueryOptions.findOne(categoryId, scope),
      retry: false,
    });
  signal?.throwIfAborted();
  return category;
};

export const useExpenseCategoriesQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: () => expenseCategoriesQueryOptions.findAll(scope),
    findOne: (categoryId: string) => expenseCategoriesQueryOptions.findOne(categoryId, scope),
  };
};

const cacheSavedCategory = async (client: QueryClient, scope: BudgetScope, category: ExpenseCategory) => {
  await client.cancelQueries({ queryKey: scopedKey(scope, expenseCategoriesQueryKeys.all) });
  if (!isActiveBudgetIdentity(client, scope)) return;
  client.setQueryData(expenseCategoriesQueryOptions.findAll(scope).queryKey, (current) => {
    if (!current) return current;
    return current.some(({ _id }) => _id === category._id)
      ? current.map((row) => (row._id === category._id ? category : row))
      : [...current, category];
  });
  client.setQueryData(expenseCategoriesQueryOptions.findOne(category._id, scope).queryKey, category);
  invalidateBudget(client, scope).catch(() => undefined);
};

export const useCreateExpenseCategoryMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ payload }: { payload: CreateExpenseCategoryDto }) => expenseCategoriesApi.create(payload, scope),
    onSuccess: (category) => cacheSavedCategory(client, scope, category),
  });
};

export const useUpdateExpenseCategoryMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: UpdateExpenseCategoryDto;
    }) => expenseCategoriesApi.update(categoryId, payload, scope),
    onSuccess: (category) => cacheSavedCategory(client, scope, category),
  });
};

export const useDeleteExpenseCategoryMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ categoryId }: { categoryId: string }) => expenseCategoriesApi.remove(categoryId, scope),
    onSuccess: async (_, { categoryId }) => {
      await client.cancelQueries({ queryKey: scopedKey(scope, expenseCategoriesQueryKeys.all) });
      if (!isActiveBudgetIdentity(client, scope)) return;
      client.setQueryData(expenseCategoriesQueryOptions.findAll(scope).queryKey, (current) => (
        current?.filter(({ _id }) => _id !== categoryId)
      ));
      client.removeQueries({ queryKey: expenseCategoriesQueryOptions.findOne(categoryId, scope).queryKey });
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
