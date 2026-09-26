import { snapshotsQueryKeys } from '@/entities/accounts-snapshots';
import { accountsQueryKeys } from '@/entities/accounts';
import { expenseLimitsQueryKeys } from '@/entities/expense-limits';
import {
  type ExpensesPaginatedResponse,
  expensesQueryKeys,
} from '@/entities/expenses';
import { reportsQueryKeys } from '@/entities/reports';
import { transactionsQueryKeys } from '@/entities/transactions';
import type { QueryClient } from '@tanstack/react-query';

export const removeExpenseFromCachedLists = (
  queryClient: QueryClient,
  expenseId: string,
) => {
  queryClient.setQueriesData<ExpensesPaginatedResponse>(
    { queryKey: expensesQueryKeys.listAll() },
    (expenses) => {
      if (!expenses?.items.some(({ _id }) => _id === expenseId)) return expenses;

      return {
        ...expenses,
        items: expenses.items.filter(({ _id }) => _id !== expenseId),
        total: Math.max(0, expenses.total - 1),
      };
    },
  );

  queryClient.removeQueries({
    queryKey: expensesQueryKeys.detail(expenseId),
    exact: true,
  });
};

export const refreshExpenseDeletionQueries = (
  queryClient: QueryClient,
  accountId: string,
) => {
  Promise.all([
    queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: expenseLimitsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: snapshotsQueryKeys.byAccount(accountId) }),
    queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
  ]).catch(() => undefined);
};
