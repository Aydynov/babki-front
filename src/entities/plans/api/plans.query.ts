import {
  mutationOptions, queryOptions, useMutation, useQueryClient,
} from '@tanstack/react-query';
import { expensesQueryKeys } from '@/entities/expenses/@x/plans';
import { reportsQueryKeys } from '@/entities/reports/@x/plans';
import { accountsQueryKeys } from '@/entities/accounts/@x/plans';
import { snapshotsQueryKeys } from '@/entities/accounts-snapshots/@x/plans';
import { transactionsQueryKeys } from '@/entities/transactions/@x/plans';
import { plansApi } from './plans.api';
import type { ClosePlanPayload, ListPlansQuery, UpdatePlanPayload } from '../model/schemas';

export const plansQueryKeys = {
  all: ['plans'] as const,
  listAll: () => [...plansQueryKeys.all, 'list'] as const,
  list: (query: ListPlansQuery) => [...plansQueryKeys.listAll(), query] as const,
};

export const plansQueryOptions = {
  findAll: (query: ListPlansQuery = {}) => queryOptions({
    queryKey: plansQueryKeys.list(query),
    queryFn: () => plansApi.findAll(query),
  }),
};

export const useCreatePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: plansApi.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: plansQueryKeys.listAll() }).catch(() => undefined);
      },
    }),
  );
};

export const useUpdatePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ planId, payload }: { planId: string; payload: UpdatePlanPayload }) => (
        plansApi.update(planId, payload)
      ),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: plansQueryKeys.listAll() }).catch(() => undefined);
      },
    }),
  );
};

export const useRemovePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: plansApi.remove,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: plansQueryKeys.listAll() }).catch(() => undefined);
      },
    }),
  );
};

export const useClosePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({ planId, payload }: { planId: string; payload: ClosePlanPayload }) => (
        plansApi.close(planId, payload)
      ),
      onSuccess: (_, { payload }) => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: plansQueryKeys.listAll() }),
          queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(payload.accountId) }),
        ]).catch(() => undefined);
      },
    }),
  );
};
