import { expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { expensesQueryOptions } from '@/entities/expenses';
import { usersQueryOptions } from '@/entities/users';
import { ManageExpenseCategoriesButton } from '@/features/manage-expense-categories';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney, sortCurrencyCodes } from '@/shared/lib/currency';
import { getPercent } from '@/shared/lib/getPercent';
import { Card } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import {
  useMemo,
  type FC,
} from 'react';

export const ExpensesByCategories: FC = () => {
  const selectedPeriod = useSelectedPeriod();
  const expensesQuery = useQuery(
    expensesQueryOptions.findAll(selectedPeriod),
  );
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesQuery.data;
  const userQuery = useQuery(usersQueryOptions.me());
  const expensesByCurrencies = useMemo(() => {
    const defaultCurrency = userQuery.data?.defaultCurrency ?? 'RUB';
    const currencies = sortCurrencyCodes(
      expensesQuery.data?.items.map(({ currency }) => currency) ?? [],
      defaultCurrency,
    );
    if (currencies.length === 0) currencies.push(defaultCurrency);
    return currencies.map((currency) => ({
      currency,
      totals: (expensesQuery.data?.items ?? [])
        .filter((expense) => expense.currency === currency)
        .reduce<Record<string, number> & { total: number }>((acc, expense) => ({
          ...acc,
          [expense.category._id]: (acc[expense.category._id] ?? 0) + expense.amount,
          total: acc.total + expense.amount,
        }), { total: 0 }),
    }));
  }, [expensesQuery.data?.items, userQuery.data?.defaultCurrency]);
  const isLoading = expensesQuery.isLoading || categoriesQuery.isLoading || userQuery.isLoading;
  const hasUnavailableData = (expensesQuery.isError && expensesQuery.data === undefined)
    || (categoriesQuery.isError && categoriesQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined);
  const retry = () => {
    expensesQuery.refetch().catch(() => undefined);
    categoriesQuery.refetch().catch(() => undefined);
    userQuery.refetch().catch(() => undefined);
  };
  const contentClassName = !isLoading && !categories?.length
    ? 'flex grow items-center justify-center'
    : 'px-0';

  return (
    <Card.Base
      aria-busy={isLoading || undefined}
      className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93"
    >
      {isLoading && <span className="sr-only">Загрузка...</span>}
      <Card.Header>
        <Card.Title>По категориям</Card.Title>
        <Card.Controls>
          <ManageExpenseCategoriesButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className={contentClassName}>
        {hasUnavailableData && <QueryError onRetry={retry} />}
        {!hasUnavailableData && (expensesQuery.isError || categoriesQuery.isError || userQuery.isError) && (
          <QueryError compact onRetry={retry} />
        )}
        {isLoading && ['first', 'second', 'third'].map((row) => (
          <div key={row} className="px-5 pb-5">
            <div className="mb-2 flex justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
        {!isLoading && !hasUnavailableData && !categories?.length && (
          <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
        )}
        {!isLoading && !hasUnavailableData && expensesByCurrencies.map(({ currency, totals }) => (
          <div key={currency} className="pb-2">
            <div className="px-5 pb-3 text-body-2 font-semibold">{currency}</div>
            {categories?.map((category) => {
              const categoryExpenses = totals[category._id] ?? 0;
              return (
                <div key={`${currency}-${category._id}`} className="px-5 pb-5">
                  <Progress.Root
                    value={getPercent(
                      categoryExpenses,
                      totals.total,
                      { multiplyBy100: true, useDiff: false },
                    )}
                    variant="danger"
                  >
                    <Progress.Label>{category.name}</Progress.Label>
                    <Progress.Value>
                      {() => formatMoney(categoryExpenses, currency)}
                    </Progress.Value>
                  </Progress.Root>
                </div>
              );
            })}
          </div>
        ))}
      </Card.Content>
    </Card.Base>
  );
};
