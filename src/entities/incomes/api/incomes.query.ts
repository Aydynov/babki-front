import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { snapshotsQueryKeys } from '@/entities/accounts-snapshots/@x/incomes';
import { accountsQueryKeys } from '@/entities/accounts/@x/incomes';
import { reportsQueryKeys } from '@/entities/reports/@x/incomes';
import { transactionsQueryKeys } from '@/entities/transactions/@x/incomes';
import { incomesApi } from './incomes.api';
import type {
  ListIncomesQuery,
  UpdateIncomeDto,
} from '../model/schemas';

export const incomesQueryKeys = {
  all: ['incomes'] as const,
  listAll: () => [...incomesQueryKeys.all, 'list'] as const,
  list: (query: ListIncomesQuery) => [...incomesQueryKeys.listAll(), query] as const,
  totalRevenue: (query: ListIncomesQuery) => [
    ...incomesQueryKeys.listAll(), query, 'totalRevenue',
  ] as const,
  details: () => [...incomesQueryKeys.all, 'detail'] as const,
  detail: (incomeId: string) => [...incomesQueryKeys.details(), incomeId] as const,
};

export const incomesQueryOptions = {
  findAll: (query: ListIncomesQuery = {}) => queryOptions({
    queryKey: incomesQueryKeys.list(query),
    queryFn: () => incomesApi.findAll(query),
  }),
  findOne: (incomeId: string) => queryOptions({
    queryKey: incomesQueryKeys.detail(incomeId),
    queryFn: () => incomesApi.findOne(incomeId),
  }),
  findTotalRevenue: (query: ListIncomesQuery = {}) => queryOptions({
    queryKey: incomesQueryKeys.totalRevenue(query),
    queryFn: () => incomesApi.findTotalRevenue(query),
  }),
};

export const useCreateIncomeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: incomesApi.create,
      onSuccess: (data) => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: incomesQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(data.accountId) }),
        ]).catch(() => undefined);
      },
    }),
  );
};

export const useUpdateIncomeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    mutationOptions({
      mutationFn: ({
        incomeId,
        payload,
      }: {
        incomeId: string;
        payload: UpdateIncomeDto;
      }) => incomesApi.update(incomeId, payload),
      onSuccess: (income, { incomeId }) => {
        queryClient.setQueryData(incomesQueryKeys.detail(incomeId), income);
        Promise.all([
          queryClient.invalidateQueries({ queryKey: incomesQueryKeys.listAll() }),
          queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(income.accountId) }),
        ]).catch(() => undefined);
      },
    }),
  );
};
