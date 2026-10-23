import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/expenses';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { expensesApi } from './expenses.api';
import { replaceExpenseInPaginatedResponse } from '../model/expense-list-cache';
import type {
  CreateExpenseDto,
  ExpensesPaginatedResponse,
  ListExpensesQuery,
  UpdateExpenseDto,
} from '../model/schemas';

export const expensesQueryKeys = {
  all: ['expenses'] as const,
  listAll: () => [...expensesQueryKeys.all, 'list'] as const,
  list: (query: ListExpensesQuery) => [...expensesQueryKeys.listAll(), query] as const,
  details: () => [...expensesQueryKeys.all, 'detail'] as const,
  detail: (expenseId: string) => [...expensesQueryKeys.details(), expenseId] as const,
};

export const expensesQueryOptions = {
  findAll: (query: ListExpensesQuery, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expensesQueryKeys.list(query)),
    queryFn: ({ signal }) => expensesApi.findAll(query, scope, signal),
  }),
  findOne: (expenseId: string, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, expensesQueryKeys.detail(expenseId)),
    queryFn: ({ signal }) => expensesApi.findOne(expenseId, scope, signal),
  }),
};

export const useExpensesQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListExpensesQuery = {}) => expensesQueryOptions.findAll(query, scope),
    findOne: (expenseId: string) => expensesQueryOptions.findOne(expenseId, scope),
  };
};

export const useCreateExpenseMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload: CreateExpenseDto) => expensesApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useUpdateExpenseMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: UpdateExpenseDto;
    }) => expensesApi.update(expenseId, payload, scope),
    onSuccess: async (updated) => {
      await client.cancelQueries({ queryKey: scopedKey(scope, expensesQueryKeys.all) });
      client.setQueryData(scopedKey(scope, expensesQueryKeys.detail(updated._id)), updated);
      client.setQueriesData<ExpensesPaginatedResponse>(
        { queryKey: scopedKey(scope, expensesQueryKeys.listAll()) },
        (data) => (data ? replaceExpenseInPaginatedResponse(data, updated) : data),
      );
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
