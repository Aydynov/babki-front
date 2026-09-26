import { expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { getReportCurrencySections, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { usePeriodStore } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Chart } from '@/shared/ui/chart';
import type { ChartConfig } from '@/shared/ui/chart';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useMemo, type FC } from 'react';
import {
  Cell,
  Pie,
  PieChart,
} from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export const ExpensesByAnnualCategories: FC = () => {
  const selectedYear = usePeriodStore((s) => s.selectedYear);

  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesQuery.data;
  const userQuery = useQuery(usersQueryOptions.me());

  const chartSections = useMemo(() => getReportCurrencySections(
    reportsQuery.data,
    selectedYear,
    userQuery.data?.defaultCurrency ?? 'RUB',
  ).map((bucket) => {
    const data = bucket.expensesByCategory
      .filter((item) => item.total > 0)
      .map((item, index) => {
        const category = categories?.find((entry) => entry._id === item.categoryId);
        return {
          id: item.categoryId,
          name: category?.name ?? item.categoryId,
          value: item.total,
          color: category?.color ?? CHART_COLORS[index % CHART_COLORS.length],
        };
      });
    return {
      currency: bucket.currency,
      data,
      total: data.reduce((sum, item) => sum + item.value, 0),
      config: Object.fromEntries(data.map((item) => [
        item.id,
        { label: item.name, color: item.color },
      ])) as ChartConfig,
    };
  }), [categories, reportsQuery.data, selectedYear, userQuery.data?.defaultCurrency]);

  if (reportsQuery.isLoading || categoriesQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit w-full min-w-0 md:w-auto md:min-w-min">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>Расходы по категориям за год</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex h-72 w-full items-center justify-center md:w-75">
            <Skeleton className="size-52 rounded-full" />
          </div>
        </Card.Content>
      </Card.Base>
    );
  }

  if ((reportsQuery.isError && reportsQuery.data === undefined)
    || (categoriesQuery.isError && categoriesQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined)) {
    return (
      <Card.Base className="h-fit min-h-72 w-full min-w-0 md:w-auto md:min-w-min">
        <QueryError onRetry={() => {
          reportsQuery.refetch().catch(() => undefined);
          categoriesQuery.refetch().catch(() => undefined);
          userQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  if (!chartSections.some(({ data }) => data.length)) {
    return (
      <Card.Base className="h-fit w-full min-w-0 md:w-auto md:min-w-min">
        <Card.Header>
          <Card.Title>Расходы по категориям за год</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex h-72 w-full items-center justify-center md:w-75">
            <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
          </div>
        </Card.Content>
      </Card.Base>
    );
  }

  return (
    <Card.Base className="h-fit w-full min-w-0 md:w-auto md:min-w-min">
      <Card.Header>
        <Card.Title>Расходы по категориям за год</Card.Title>
      </Card.Header>
      <Card.Content>
        {(reportsQuery.isError || categoriesQuery.isError || userQuery.isError) && (
          <QueryError
            compact
            onRetry={() => {
              reportsQuery.refetch().catch(() => undefined);
              categoriesQuery.refetch().catch(() => undefined);
              userQuery.refetch().catch(() => undefined);
            }}
          />
        )}
        {chartSections.map(({
          currency, data, total, config,
        }) => (
          <div key={currency}>
            <Body1>{currency}</Body1>
            <Chart.Root config={config} className="relative h-72 w-full md:w-75">
              <PieChart>
                <Chart.Tooltip
                  content={(
                    <Chart.TooltipContent
                      hideLabel
                      valueFormatter={(value) => {
                        const n = Number(value);
                        return Number.isNaN(n) ? value : formatMoney(n, currency);
                      }}
                    />
                  )}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  strokeWidth={2}
                >
                  {data.map((item) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Pie>
                <Chart.Legend content={<Chart.LegendContent nameKey="name" />} />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-muted-foreground text-xs">Итого</span>
                <span className="font-semibold text-sm">{formatMoney(total, currency)}</span>
              </div>
            </Chart.Root>
          </div>
        ))}
      </Card.Content>
    </Card.Base>
  );
};
