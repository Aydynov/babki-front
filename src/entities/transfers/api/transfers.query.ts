import { snapshotsQueryKeys } from '@/entities/accounts-snapshots/@x/transfers';
import { accountsQueryKeys } from '@/entities/accounts/@x/transfers';
import { reportsQueryKeys } from '@/entities/reports/@x/transfers';
import { transactionsQueryKeys } from '@/entities/transactions/@x/transfers';
import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CreateTransferDto,
  ListTransfersQuery,
  UpdateTransferDto,
} from '../model/schemas';
import { transfersApi } from './transfers.api';

export const transfersQueryKeys = {
  all: ['transfers'] as const,
  lists: () => [...transfersQueryKeys.all, 'list'] as const,
  list: (query: ListTransfersQuery) => [...transfersQueryKeys.lists(), query] as const,
  details: () => [...transfersQueryKeys.all, 'detail'] as const,
  detail: (transferId: string) => [...transfersQueryKeys.details(), transferId] as const,
};

export const transfersQueryOptions = {
  findAll: (query: ListTransfersQuery = {}) => queryOptions({
    queryKey: transfersQueryKeys.list(query),
    queryFn: () => transfersApi.findAll(query),
  }),
  findOne: (transferId: string) => queryOptions({
    queryKey: transfersQueryKeys.detail(transferId),
    queryFn: () => transfersApi.findOne(transferId),
  }),
};

const invalidateTransferEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  sourceAccountId: string,
  destinationAccountId: string,
) => {
  Promise.all([
    queryClient.invalidateQueries({ queryKey: transfersQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(sourceAccountId) }),
    queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(destinationAccountId) }),
  ]).catch(() => undefined);
};

export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: (payload: CreateTransferDto) => transfersApi.create(payload),
    onSuccess: (transfer) => invalidateTransferEffects(
      queryClient,
      transfer.source.accountId,
      transfer.destination.accountId,
    ),
  }));
};

export const useUpdateTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: ({ transferId, payload }: { transferId: string; payload: UpdateTransferDto }) => (
      transfersApi.update(transferId, payload)
    ),
    onSuccess: (transfer) => {
      queryClient.setQueryData(transfersQueryKeys.detail(transfer._id), transfer);
      invalidateTransferEffects(
        queryClient,
        transfer.source.accountId,
        transfer.destination.accountId,
      );
    },
  }));
};

export const useDeleteTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(mutationOptions({
    mutationFn: async ({
      transferId,
      sourceAccountId,
      destinationAccountId,
    }: {
      transferId: string;
      sourceAccountId: string;
      destinationAccountId: string;
    }) => {
      await transfersApi.remove(transferId);
      return { transferId, sourceAccountId, destinationAccountId };
    },
    onSuccess: ({ transferId, sourceAccountId, destinationAccountId }) => {
      queryClient.removeQueries({ queryKey: transfersQueryKeys.detail(transferId) });
      invalidateTransferEffects(queryClient, sourceAccountId, destinationAccountId);
    },
  }));
};
