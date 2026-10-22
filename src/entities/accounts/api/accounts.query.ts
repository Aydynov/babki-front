import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/accounts';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { accountsApi } from './accounts.api';
import type {
  CreateAccountDto,
  FindAccountByQuery,
  RenameAccountDto,
} from '../model/schemas';

export const accountsQueryKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountsQueryKeys.all, 'list'] as const,
  list: (query: FindAccountByQuery) => [...accountsQueryKeys.lists(), query] as const,
  details: () => [...accountsQueryKeys.all, 'detail'] as const,
  detail: (accountId: string) => [...accountsQueryKeys.details(), accountId] as const,
};

export const accountsQueryOptions = {
  findAll: (query: FindAccountByQuery, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, accountsQueryKeys.list(query)),
    queryFn: ({ signal }) => accountsApi.findAll(query, scope, signal),
  }),
  findOne: (accountId: string, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, accountsQueryKeys.detail(accountId)),
    queryFn: ({ signal }) => accountsApi.findOne(accountId, scope, signal),
  }),
};

export const useAccountsQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: FindAccountByQuery = {}) => accountsQueryOptions.findAll(query, scope),
    findOne: (accountId: string) => accountsQueryOptions.findOne(accountId, scope),
  };
};

export const useCreateAccountMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload: CreateAccountDto) => accountsApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useRenameAccountMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: RenameAccountDto;
    }) => accountsApi.rename(accountId, payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useArchiveAccountMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (accountId: string) => accountsApi.archive(accountId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useDeleteAccountMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (accountId: string) => accountsApi.remove(accountId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
