import type { QueryClient } from '@tanstack/react-query';
import type { BudgetScope } from '@/shared/types';

export { budgetPath, scopedKey, utcPeriod } from '../budget-scope';

export const isActiveBudgetIdentity = (client: QueryClient, scope: BudgetScope) => (
  client.getQueryData<{ _id: string }>(['users', 'me'])?._id === scope.userId
);

export const invalidateBudget = async (client: QueryClient, scope: BudgetScope) => {
  if (!isActiveBudgetIdentity(client, scope)) return;
  await client.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[1] === scope.userId
      && queryKey[2] === scope.kind
      && queryKey[3] === (scope.groupId ?? scope.userId),
  });
};
