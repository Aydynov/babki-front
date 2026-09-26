import { getMonthlyCurrencySeries, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { ChartCurrencySelect, getMonthlyMetricCurrencies, useChartCurrency } from '@/features/select-chart-currency';
import { usePeriodStore } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Chart } from '@/shared/ui/chart';
import type { ChartConfig } from '@/shared/ui/chart';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, endOfYear, format } from 'date-fns';
import i18next from 'i18next';
import { useMemo, type FC } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from 'recharts';

const locale = i18next.language;
const chartConfig = {
  expenses: {
    label: 'Расходы',
    color: 'var(--chart-1)',
  },
  incomes: {
    label: 'Доходы',
    color: 'var(--chart-2)',
  },
  saving: {
    label: 'Накопления',
    color: 'var(--chart-3)',
  },
  transfersIn: {
    label: 'Переводы входящие',
    color: 'var(--chart-4)',
  },
  transfersOut: {
    label: 'Переводы исходящие',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export const ExpensesByMonths: FC = () => {
  const selectedYear = usePeriodStore((s) => s.selectedYear);
  const selectedMonth = usePeriodStore((s) => s.selectedMonth);
  const currentYear = new Date().getFullYear();

  const periodQuery = useMemo(() => ({
    fromDate: format(new Date(selectedYear, 0, 1), 'yyyy-MM-dd'),
    toDate: selectedYear === currentYear
      ? format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
      : format(endOfYear(new Date(selectedYear, 11)), 'yyyy-MM-dd'),
  }), [selectedYear, selectedMonth, currentYear]);

  const reportsQuery = useQuery(
    reportsQueryOptions.monthly(periodQuery),
  );
  const userQuery = useQuery(usersQueryOptions.me());

  const currencySeries = useMemo(
    () => getMonthlyCurrencySeries(
      reportsQuery.data,
      userQuery.data?.defaultCurrency ?? 'RUB',
    ),
    [reportsQuery.data, userQuery.data?.defaultCurrency],
  );
  const currencies = useMemo(() => (reportsQuery.data
    ? getMonthlyMetricCurrencies(currencySeries)
    : undefined), [reportsQuery.data, currencySeries]);
  const [currency, setCurrency] = useChartCurrency(currencies, userQuery.data?.defaultCurrency ?? 'RUB');
  const periods = currencySeries.find((series) => series.currency === currency)?.periods ?? [];

  if (reportsQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit w-full min-w-0 md:w-auto md:min-w-max">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>Расходы по месяцам</Card.Title>
          <Card.Controls><Skeleton className="h-8 w-18" /></Card.Controls>
        </Card.Header>
        <Card.Content className="overflow-x-auto">
          <Skeleton className="h-92.5 aspect-video" />
        </Card.Content>
      </Card.Base>
    );
  }

  if ((reportsQuery.isError && reportsQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined)) {
    return (
      <Card.Base className="h-fit min-h-96 w-full min-w-0 md:w-auto md:min-w-max">
        <QueryError onRetry={() => {
          reportsQuery.refetch().catch(() => undefined);
          userQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  return (
    <Card.Base className="h-fit w-full min-w-0 md:w-auto md:min-w-max">
      <Card.Header>
        <Card.Title>Расходы по месяцам</Card.Title>
        {currencies && (
          <Card.Controls>
            <ChartCurrencySelect
              chartTitle="Расходы по месяцам"
              currencies={currencies}
              value={currency}
              onChange={setCurrency}
            />
          </Card.Controls>
        )}
      </Card.Header>
      <Card.Content className="overflow-x-auto">
        {(reportsQuery.isError || userQuery.isError) && (
          <QueryError
            compact
            onRetry={() => {
              reportsQuery.refetch().catch(() => undefined);
              userQuery.refetch().catch(() => undefined);
            }}
          />
        )}
        {currency ? (
          <Chart.Root className="h-92.5" config={chartConfig}>
            <BarChart data={periods}>
              <Chart.Legend content={<Chart.LegendContent />} />
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => new Date(value).toLocaleDateString(locale, { month: 'short' })}
              />
              <Chart.Tooltip
                content={(
                  <Chart.TooltipContent
                    valueFormatter={(value) => {
                      const numberValue = Number(value);
                      if (Number.isNaN(numberValue)) {
                        return value;
                      }

                      return formatMoney(numberValue, currency);
                    }}
                  />
              )}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={1}
                activeBar
              />
              <Bar
                dataKey="incomes"
                fill="var(--color-incomes)"
                radius={1}
                activeBar
              />
              <Bar
                dataKey="saving"
                fill="var(--color-saving)"
                radius={1}
                activeBar
              />
              <Bar
                dataKey="transfersIn"
                fill="var(--color-transfersIn)"
                radius={1}
                activeBar
              />
              <Bar
                dataKey="transfersOut"
                fill="var(--color-transfersOut)"
                radius={1}
                activeBar
              />
            </BarChart>
          </Chart.Root>
        ) : (
          <div className="flex h-92.5 items-center justify-center">
            <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
          </div>
        )}
      </Card.Content>
    </Card.Base>
  );
};
