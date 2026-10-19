import type { BudgetScope } from '@/shared/types';
import { scopedKey } from '@/shared/lib/budget-api';
import { queryOptions } from '@tanstack/react-query';
import { snapshotsApi } from './snapshots.api';
import type { SnapshotFindByQuery } from '../model/schemas';

export const snapshotsQueryKeys = {
  all: ['snapshots'] as const,
  byAccount: (accountId: string, scope?: BudgetScope) => scopedKey(scope, [...snapshotsQueryKeys.all, accountId]),
  detail: (accountId: string, date: string, scope?: BudgetScope) => (
    [...snapshotsQueryKeys.byAccount(accountId, scope), date]
  ),
};

export const snapshotsQueryOptions = {
  findBy: (params: SnapshotFindByQuery, scope?: BudgetScope) => queryOptions({
    queryKey: snapshotsQueryKeys.detail(params.accountId, params.date, scope),
    queryFn: ({ signal }) => snapshotsApi.findBy(params, scope, signal),
  }),
};
