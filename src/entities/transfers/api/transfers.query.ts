import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useBudgetScope } from '@/entities/budgets/@x/transfers';
import type { BudgetScope } from '@/shared/types';
import { scopedKey, invalidateBudget } from '@/shared/lib/budget-api';
import { loadPaginatedHistory } from '@/shared/lib/paginated-history';
import { transfersApi } from './transfers.api';
import type {
  CreateTransferDto,
  ListTransfersQuery,
  UpdateTransferDto,
} from '../model/schemas';

type AccountHistoryQuery = Pick<
  ListTransfersQuery,
  'accountId' | 'fromDate' | 'toDate'
>;

export const transfersQueryKeys = {
  all: ['transfers'] as const,
  lists: () => [...transfersQueryKeys.all, 'list'] as const,
  list: (query: ListTransfersQuery) => [...transfersQueryKeys.lists(), query] as const,
  details: () => [...transfersQueryKeys.all, 'detail'] as const,
  detail: (transferId: string) => [...transfersQueryKeys.details(), transferId] as const,
};

export const transfersQueryOptions = {
  findAll: (query: ListTransfersQuery, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, transfersQueryKeys.list(query)),
    queryFn: ({ signal }) => transfersApi.findAll(query, scope, signal),
  }),
  findOne: (transferId: string, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, transfersQueryKeys.detail(transferId)),
    queryFn: ({ signal }) => transfersApi.findOne(transferId, scope, signal),
  }),
  accountHistory: (query: AccountHistoryQuery, scope: BudgetScope) => queryOptions({
    queryKey: scopedKey(scope, ['transfers', 'accountHistory', query]),
    queryFn: ({ signal }) => loadPaginatedHistory(
      (pagination) => transfersApi.findAll({ ...query, ...pagination }, scope, signal),
    ),
  }),
};

export const useTransfersQueryOptions = () => {
  const scope = useBudgetScope();
  return {
    findAll: (query: ListTransfersQuery = {}) => transfersQueryOptions.findAll(query, scope),
    findOne: (transferId: string) => transfersQueryOptions.findOne(transferId, scope),
    accountHistory: (query: AccountHistoryQuery) => transfersQueryOptions.accountHistory(query, scope),
  };
};

export const useCreateTransferMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (payload: CreateTransferDto) => transfersApi.create(payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useUpdateTransferMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      transferId,
      payload,
    }: {
      transferId: string;
      payload: UpdateTransferDto;
    }) => transfersApi.update(transferId, payload, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};

export const useDeleteTransferMutation = () => {
  const scope = useBudgetScope();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      transferId,
    }: {
      transferId: string;
      sourceAccountId: string;
      destinationAccountId: string;
    }) => transfersApi.remove(transferId, scope),
    onSuccess: () => {
      invalidateBudget(client, scope).catch(() => undefined);
    },
  });
};
