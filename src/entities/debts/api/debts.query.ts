import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { debtTransactionsQueryKeys } from '@/entities/debt-transactions/@x/debts';
import { accountsQueryKeys } from '@/entities/accounts/@x/debts';
import { snapshotsQueryKeys } from '@/entities/accounts-snapshots/@x/debts';
import { incomesQueryKeys } from '@/entities/incomes/@x/debts';
import { reportsQueryKeys } from '@/entities/reports/@x/debts';
import { transactionsQueryKeys } from '@/entities/transactions/@x/debts';
import { debtsApi } from './debts.api';
import type {
  CreateDebtDto,
  ListDebtsQuery,
  RepayDebtDto,
  UpdateDebtDto,
} from '../model/schemas';

export const debtsQueryKeys = {
  all: ['debts'] as const,
  lists: () => [...debtsQueryKeys.all, 'list'] as const,
  list: (query: ListDebtsQuery) => [...debtsQueryKeys.lists(), query] as const,
  details: () => [...debtsQueryKeys.all, 'detail'] as const,
  detail: (debtId: string) => [...debtsQueryKeys.details(), debtId] as const,
};

export const debtsQueryOptions = {
  findAll: (query: ListDebtsQuery = {}) => queryOptions({
    queryKey: debtsQueryKeys.list(query),
    queryFn: () => debtsApi.findAll(query),
  }),
  findOne: (debtId: string) => queryOptions({
    queryKey: debtsQueryKeys.detail(debtId),
    queryFn: () => debtsApi.findOne(debtId),
  }),
};

export const useCreateDebtMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ payload }: { payload: CreateDebtDto }) => debtsApi.create(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: debtsQueryKeys.all }).catch(() => undefined);
      },
    }),
  );
};

export const useUpdateDebtMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ debtId, payload }: { debtId: string; payload: UpdateDebtDto }) => debtsApi.update(debtId, payload),
      onSuccess: (debt, { debtId }) => {
        queryClient.setQueryData(debtsQueryKeys.detail(debtId), debt);
        queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() }).catch(() => undefined);
      },
    }),
  );
};

export const useRepayDebtMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ debtId, payload }: { debtId: string; payload: RepayDebtDto }) => debtsApi.repay(debtId, payload),
      onSuccess: (debt, { debtId, payload }) => {
        queryClient.setQueryData(debtsQueryKeys.detail(debtId), debt);
        Promise.all([
          queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() }),
          queryClient.invalidateQueries({ queryKey: debtTransactionsQueryKeys.lists(debtId) }),
          ...(payload.isIncome && payload.accountId ? [
            queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: incomesQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
            queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(payload.accountId) }),
          ] : []),
        ]).catch(() => undefined);
      },
    }),
  );
};

export const useDeleteDebtMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ debtId }: { debtId: string }) => debtsApi.remove(debtId),
      onSuccess: (_, { debtId }) => {
        queryClient.removeQueries({ queryKey: debtsQueryKeys.detail(debtId) });
        queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() }).catch(() => undefined);
      },
    }),
  );
};
