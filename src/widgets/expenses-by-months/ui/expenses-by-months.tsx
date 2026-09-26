import { getMonthlyCurrencySeries, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { usePeriodStore } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Chart } from '@/shared/ui/chart';
import type { ChartConfig } from '@/shared/ui/chart';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
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

  if (reportsQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit w-full min-w-0 md:w-auto md:min-w-max">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>Расходы по месяцам</Card.Title>
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
        <div className="flex flex-col gap-6">
          {currencySeries.map(({ currency, periods }) => (
            <div key={currency}>
              <h3 className="mb-2 text-body-2">{currency}</h3>
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
            </div>
          ))}
        </div>
      </Card.Content>
    </Card.Base>
  );
};
