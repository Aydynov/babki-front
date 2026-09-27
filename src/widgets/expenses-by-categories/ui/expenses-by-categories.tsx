import { expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { getMonthlyExpenseCategoryBuckets, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { ManageExpenseCategoriesButton } from '@/features/manage-expense-categories';
import { ChartCurrencySelect, useChartCurrency } from '@/features/select-chart-currency';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
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
  const selectedYear = selectedPeriod.fromDate.slice(0, 4);
  const reportPeriod = selectedPeriod.fromDate.slice(0, 7);
  const reportQuery = useMemo(() => ({
    fromDate: `${selectedYear}-01-01`,
    toDate: Number(selectedYear) === new Date().getFullYear()
      ? selectedPeriod.toDate
      : `${selectedYear}-12-31`,
  }), [selectedPeriod.toDate, selectedYear]);
  const reportsQuery = useQuery(reportsQueryOptions.monthly(reportQuery));
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesQuery.data;
  const userQuery = useQuery(usersQueryOptions.me());
  const currencyBuckets = useMemo(() => getMonthlyExpenseCategoryBuckets(
    reportsQuery.data,
    reportPeriod,
  ), [reportsQuery.data, reportPeriod]);
  const currencies = useMemo(() => (reportsQuery.data
    ? currencyBuckets.map(({ currency }) => currency)
    : undefined), [reportsQuery.data, currencyBuckets]);
  const [currency, setCurrency] = useChartCurrency(
    userQuery.data ? currencies : undefined,
    userQuery.data?.defaultCurrency ?? 'RUB',
  );
  const selectedBucket = currencyBuckets.find((bucket) => bucket.currency === currency);
  const isLoading = reportsQuery.isLoading || categoriesQuery.isLoading || userQuery.isLoading;
  const hasUnavailableData = (reportsQuery.isError && reportsQuery.data === undefined)
    || (categoriesQuery.isError && categoriesQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined);
  const retry = () => {
    reportsQuery.refetch().catch(() => undefined);
    categoriesQuery.refetch().catch(() => undefined);
    userQuery.refetch().catch(() => undefined);
  };
  const contentClassName = !isLoading && (!categories?.length || !currency)
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
          {!isLoading && !hasUnavailableData && currencies && (
            <ChartCurrencySelect
              chartTitle="По категориям"
              ariaLabel="Валюта расходов по категориям за месяц"
              currencies={currencies}
              value={currency}
              onChange={setCurrency}
            />
          )}
          <ManageExpenseCategoriesButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className={contentClassName}>
        {hasUnavailableData && <QueryError onRetry={retry} />}
        {!hasUnavailableData && (reportsQuery.isError || categoriesQuery.isError || userQuery.isError) && (
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
        {!isLoading && !hasUnavailableData && (!categories?.length || !currency) && (
          <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
        )}
        {!isLoading && !hasUnavailableData && currency && categories?.map((category) => {
          const categoryExpenses = selectedBucket?.expensesByCategory
            .find(({ categoryId }) => categoryId === category._id)?.total ?? 0;
          return (
            <div key={category._id} className="px-5 pb-5">
              <Progress.Root
                value={getPercent(
                  categoryExpenses,
                  selectedBucket?.expenses ?? 0,
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
      </Card.Content>
    </Card.Base>
  );
};
