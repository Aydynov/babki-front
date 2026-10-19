import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/expense-categories';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { expenseCategoriesApi } from './expense-categories.api';
import type { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from '../model/schemas';

export const expenseCategoriesQueryKeys = {
  all: ['expense-categories'] as const,
  lists: () => [...expenseCategoriesQueryKeys.all, 'list'] as const,
  details: () => [...expenseCategoriesQueryKeys.all, 'detail'] as const,
  detail: (categoryId: string) => [...expenseCategoriesQueryKeys.details(), categoryId] as const,
};

export const expenseCategoriesQueryOptions = {
  findAll: (scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseCategoriesQueryKeys.lists()),
    queryFn: ({ signal }) => expenseCategoriesApi.findAll(scope, signal),
  }),
  findOne: (categoryId: string, scope?: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expenseCategoriesQueryKeys.detail(categoryId)),
    queryFn: ({ signal }) => expenseCategoriesApi.findOne(categoryId, scope, signal),
  }),
};

export const useExpenseCategoriesQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: () => expenseCategoriesQueryOptions.findAll(scope),
    findOne: (categoryId: string) => expenseCategoriesQueryOptions.findOne(categoryId, scope),
  };
};

export const useCreateExpenseCategoryMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ payload }: { payload: CreateExpenseCategoryDto }) => expenseCategoriesApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
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
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useDeleteExpenseCategoryMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ categoryId }: { categoryId: string }) => expenseCategoriesApi.remove(categoryId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
