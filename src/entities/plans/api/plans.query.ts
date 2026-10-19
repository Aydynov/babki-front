import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/plans';
import type { BudgetScope } from '@/shared/types';
import { invalidateBudget, scopedKey } from '@/shared/lib/budget-api';
import { plansApi } from './plans.api';
import type {
  ClosePlanPayload, CreatePlanPayload, ListPlansQuery, UpdatePlanPayload,
} from '../model/schemas';

export const plansQueryKeys = {
  all: ['plans'] as const,
  listAll: (scope?: BudgetScope) => [...scopedKey(scope, ['plans']), 'list'] as const,
  list: (query: ListPlansQuery, scope?: BudgetScope) => [...plansQueryKeys.listAll(scope), query] as const,
  detail: (id: string, scope?: BudgetScope) => [...scopedKey(scope, ['plans']), 'detail', id] as const,
};

export const plansQueryOptions = {
  findAll: (query: ListPlansQuery = {}, scope?: BudgetScope) => queryOptions({
    queryKey: plansQueryKeys.list(query, scope),
    queryFn: ({ signal }) => plansApi.findAll(query, signal, scope),
  }),
  findOne: (id: string, scope?: BudgetScope) => queryOptions({
    queryKey: plansQueryKeys.detail(id, scope),
    queryFn: ({ signal }) => plansApi.findOne(id, signal, scope),
  }),
};

export const usePlansQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListPlansQuery = {}) => plansQueryOptions.findAll(query, scope),
    findOne: (id: string) => plansQueryOptions.findOne(id, scope),
  };
};

export const useCreatePlanMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload: CreatePlanPayload) => plansApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useUpdatePlanMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ planId, payload }: { planId: string; payload: UpdatePlanPayload }) => (
      plansApi.update(planId, payload, scope)
    ),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useRemovePlanMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (id: string) => plansApi.remove(id, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useArchivePlanMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (id: string) => plansApi.archive(id, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useClosePlanMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ planId, payload }: { planId: string; payload: ClosePlanPayload }) => (
      plansApi.close(planId, payload, scope)
    ),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
    onError: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
