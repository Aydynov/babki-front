import { snapshotsQueryKeys } from '@/entities/accounts-snapshots';
import { accountsQueryKeys } from '@/entities/accounts';
import { debtsQueryKeys } from '@/entities/debts';
import { expenseLimitsQueryKeys } from '@/entities/expense-limits';
import { plansQueryKeys } from '@/entities/plans';
import { reportsQueryKeys } from '@/entities/reports';
import { transactionsQueryKeys } from '@/entities/transactions';
import { usersQueryKeys } from '@/entities/users';
import type { QueryClient } from '@tanstack/react-query';

export const invalidateAccountDependents = (queryClient: QueryClient) => {
  Promise.all([
    queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: plansQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: debtsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: expenseLimitsQueryKeys.all }),
  ]).catch(() => undefined);
};
