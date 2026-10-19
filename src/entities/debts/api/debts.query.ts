import { debtTransactionsQueryKeys, type GroupRepayment } from '@/entities/debt-transactions/@x/debts';
import {
  type QueryClient, queryOptions, useMutation, useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/debts';
import type { BudgetScope } from '@/shared/types';
import { invalidateBudget, isActiveBudgetIdentity, scopedKey } from '@/shared/lib/budget-api';
import { debtsApi } from './debts.api';
import type {
  Debt, CreateDebtDto, CreateGroupDebtDto, ListDebtsQuery, RepayDebtDto, UpdateDebtDto, UpdateGroupDebtDto,
} from '../model/schemas';

export const debtsQueryKeys = {
  all: ['debts'] as const,
  lists: (scope?: BudgetScope) => [...scopedKey(scope, ['debts']), 'list'] as const,
  list: (query: ListDebtsQuery, scope?: BudgetScope) => [...debtsQueryKeys.lists(scope), query] as const,
  details: (scope?: BudgetScope) => [...scopedKey(scope, ['debts']), 'detail'] as const,
  detail: (id: string, scope?: BudgetScope) => [...debtsQueryKeys.details(scope), id] as const,
};

export const debtsQueryOptions = {
  findAll: (query: ListDebtsQuery = {}, scope?: BudgetScope) => queryOptions({
    queryKey: debtsQueryKeys.list(query, scope),
    queryFn: ({ signal }) => debtsApi.findAll(query, signal, scope),
  }),
  findOne: (id: string, scope?: BudgetScope) => queryOptions({
    queryKey: debtsQueryKeys.detail(id, scope),
    queryFn: ({ signal }) => debtsApi.findOne(id, signal, scope),
  }),
};

export const useDebtsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListDebtsQuery = {}) => debtsQueryOptions.findAll(query, scope),
    findOne: (id: string) => debtsQueryOptions.findOne(id, scope),
  };
};

const applyRepayment = (client: QueryClient, scope: BudgetScope, result: { debt: Debt; repayment: GroupRepayment }) => {
  if (!isActiveBudgetIdentity(client, scope)) return;
  const { debt, repayment } = result;
  client.setQueryData(debtsQueryKeys.detail(debt._id, scope), debt);
  client.setQueryData(debtTransactionsQueryKeys.detail(debt._id, repayment._id, scope), repayment);
  client.setQueriesData<{
    items: GroupRepayment[]; total: number; page: number; limit: number;
  }>({ queryKey: debtTransactionsQueryKeys.lists(debt._id, scope) }, (old) => {
    if (!old) return old;
    const exists = old.items.some((item) => item._id === repayment._id);
    if (exists) return { ...old, items: old.items.map((item) => (item._id === repayment._id ? repayment : item)) };
    if (repayment.cancelledAt || old.page !== 1) return old;
    return { ...old, total: old.total + 1, items: [repayment, ...old.items].slice(0, old.limit) };
  });
};

export const useCreateDebtMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ payload }: { payload: CreateDebtDto | CreateGroupDebtDto }) => debtsApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useUpdateDebtMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ debtId, payload }: { debtId: string; payload: UpdateDebtDto | UpdateGroupDebtDto }) => (
      debtsApi.update(debtId, payload, scope)
    ),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useRepayDebtMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async ({ debtId, payload }: { debtId: string; payload: RepayDebtDto }) => {
      const result = await debtsApi.repay(debtId, payload, scope);
      if ('debt' in result) {
        applyRepayment(client, scope, result);
        return result.debt;
      }
      return result;
    },
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
    onError: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useCancelDebtRepaymentMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ debtId, repaymentId }: { debtId: string; repaymentId: string }) => (
      debtsApi.cancelRepayment(debtId, repaymentId, scope)
    ),
    onSuccess: (result) => {
      applyRepayment(client, scope, result);
      invalidateBudget(client, scope).catch(() => undefined);
    },
    onError: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useArchiveDebtMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (id: string) => debtsApi.archive(id, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useDeleteDebtMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ debtId }: { debtId: string }) => debtsApi.remove(debtId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
