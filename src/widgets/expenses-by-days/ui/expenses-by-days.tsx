import { expensesQueryOptions } from '@/entities/expenses';
import { usersQueryOptions } from '@/entities/users';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney, sortCurrencyCodes } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Chart } from '@/shared/ui/chart';
import type { ChartConfig } from '@/shared/ui/chart';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
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
  const expensesByCurrency = useMemo(() => {
    const defaultCurrency = userQuery.data?.defaultCurrency ?? 'RUB';
    const currencies = sortCurrencyCodes(
      expensesQuery.data?.items.map(({ currency }) => currency) ?? [],
      defaultCurrency,
    );
    if (currencies.length === 0) currencies.push(defaultCurrency);
    return currencies.map((currency) => ({
      currency,
      items: expensesQuery.data?.items
        .filter((expense) => expense.currency === currency)
        .map((expense) => ({ date: expense.transactionDate, amount: expense.amount }))
        .sort((a, b) => (isAfter(a.date, b.date) ? 1 : -1)) ?? [],
    }));
  }, [expensesQuery.data?.items, userQuery.data?.defaultCurrency]);

  if (expensesQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit w-full min-w-0 md:w-200 md:min-w-max">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>Расходы по дням</Card.Title>
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
        <div className="flex flex-col gap-6">
          {expensesByCurrency.map(({ currency, items }) => (
            <div key={currency}>
              <h3 className="mb-2 text-body-2">{currency}</h3>
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
            </div>
          ))}
        </div>
      </Card.Content>
    </Card.Base>
  );
};
