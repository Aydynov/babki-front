import { expensesQueryOptions } from '@/entities/expenses';
import { usersQueryOptions } from '@/entities/users';
import { ChartCurrencySelect, getDailyExpenseCurrencies, useChartCurrency } from '@/features/select-chart-currency';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Chart } from '@/shared/ui/chart';
import type { ChartConfig } from '@/shared/ui/chart';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { isAfter } from 'date-fns';
import {
  useMemo,
  type FC,
} from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from 'recharts';

const chartConfig = {
  amount: {
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export const ExpensesByDays: FC = () => {
  const selectedPeriod = useSelectedPeriod();
  const expensesQuery = useQuery(
    expensesQueryOptions.findAll(selectedPeriod),
  );
  const userQuery = useQuery(usersQueryOptions.me());
  const currencies = useMemo(() => (expensesQuery.data
    ? getDailyExpenseCurrencies(expensesQuery.data.items)
    : undefined), [expensesQuery.data]);
  const [currency, setCurrency] = useChartCurrency(currencies, userQuery.data?.defaultCurrency ?? 'RUB');
  const items = useMemo(() => expensesQuery.data?.items
    .filter((expense) => expense.currency === currency)
    .map((expense) => ({ date: expense.transactionDate, amount: expense.amount }))
    .sort((a, b) => (isAfter(a.date, b.date) ? 1 : -1)) ?? [], [expensesQuery.data, currency]);

  if (expensesQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit w-full min-w-0 md:w-200 md:min-w-max">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>Расходы по дням</Card.Title>
          <Card.Controls><Skeleton className="h-8 w-18" /></Card.Controls>
        </Card.Header>
        <Card.Content>
          <Skeleton className="aspect-video w-full" />
        </Card.Content>
      </Card.Base>
    );
  }

  if ((expensesQuery.isError && expensesQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined)) {
    return (
      <Card.Base className="h-fit min-h-64 w-full min-w-0 md:w-200 md:min-w-max">
        <QueryError onRetry={() => {
          expensesQuery.refetch().catch(() => undefined);
          userQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  return (
    <Card.Base className="h-fit w-full min-w-0 md:w-200 md:min-w-max">
      <Card.Header>
        <Card.Title>Расходы по дням</Card.Title>
        {currencies && (
          <Card.Controls>
            <ChartCurrencySelect
              chartTitle="Расходы по дням"
              currencies={currencies}
              value={currency}
              onChange={setCurrency}
            />
          </Card.Controls>
        )}
      </Card.Header>
      <Card.Content>
        {(expensesQuery.isError || userQuery.isError) && (
          <QueryError
            compact
            onRetry={() => {
              expensesQuery.refetch().catch(() => undefined);
              userQuery.refetch().catch(() => undefined);
            }}
          />
        )}
        {currency ? (
          <Chart.Root config={chartConfig}>
            <LineChart data={items}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <Chart.Tooltip
                content={(
                  <Chart.TooltipContent
                    nameKey="amount"
                    labelFormatter={(value) => new Date(String(value)).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    formatter={(value) => {
                      const numberValue = Number(value);
                      if (Number.isNaN(numberValue)) {
                        return value;
                      }

                      return formatMoney(numberValue, currency);
                    }}
                  />
              )}
              />
              <Line
                dataKey="amount"
                type="monotone"
                stroke="var(--color-amount)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </Chart.Root>
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
          </div>
        )}
      </Card.Content>
    </Card.Base>
  );
};
