import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
  findAll: (query: FindAccountByQuery = {}) => queryOptions({
    queryKey: accountsQueryKeys.list(query),
    queryFn: () => accountsApi.findAll(query),
  }),
  findOne: (accountId: string) => queryOptions({
    queryKey: accountsQueryKeys.detail(accountId),
    queryFn: () => accountsApi.findOne(accountId),
  }),
};

export const useCreateAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: (payload: CreateAccountDto) => accountsApi.create(payload),
    onSuccess: (account) => {
      queryClient.setQueryData(accountsQueryKeys.detail(account._id), account);
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.lists() }).catch(() => undefined);
    },
  }));
};

export const useRenameAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: ({ accountId, payload }: { accountId: string; payload: RenameAccountDto }) => (
      accountsApi.rename(accountId, payload)
    ),
    onSuccess: (account) => {
      queryClient.setQueryData(accountsQueryKeys.detail(account._id), account);
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.lists() }).catch(() => undefined);
    },
  }));
};

export const useArchiveAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: (accountId: string) => accountsApi.archive(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }).catch(() => undefined);
    },
  }));
};

export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: (accountId: string) => accountsApi.remove(accountId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all });
      },
    }),
  );
};
