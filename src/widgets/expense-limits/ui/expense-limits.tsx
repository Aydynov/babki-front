import { expenseLimitsQueryOptions } from '@/entities/expense-limits';
import { ManageExpenseLimitsButton } from '@/features/manage-expense-limits';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

export const ExpenseLimits: FC = () => {
  const selectedPeriod = useSelectedPeriod();
  const limitsQuery = useQuery(
    expenseLimitsQueryOptions.findAll({ periodDate: selectedPeriod.toDate }),
  );

  if (limitsQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>По лимитам</Card.Title>
          <Card.Controls>
            <ManageExpenseLimitsButton periodDate={selectedPeriod.toDate} />
          </Card.Controls>
        </Card.Header>
        <Card.Content className="px-0">
          {['first', 'second', 'third'].map((row) => (
            <div key={row} className="px-5 pb-5">
              <div className="mb-2 flex justify-between gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </Card.Content>
      </Card.Base>
    );
  }

  if (limitsQuery.isError && limitsQuery.data === undefined) {
    return (
      <Card.Base className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93">
        <QueryError onRetry={() => {
          limitsQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  return (
    <Card.Base className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93">
      <Card.Header>
        <Card.Title>По лимитам</Card.Title>
        <Card.Controls>
          <ManageExpenseLimitsButton periodDate={selectedPeriod.toDate} />
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0">
        {limitsQuery.isError && (
        <QueryError
          compact
          onRetry={() => {
            limitsQuery.refetch().catch(() => undefined);
          }}
        />
        )}
        {limitsQuery.data?.map(({
          _id, category, currency, total, rest,
        }) => (
          <div key={_id} className="px-5 pb-5">
            <Progress.Root value={((total - rest) / total) * 100} variant={rest > 0 ? 'success' : 'danger'}>
              <Progress.Label>{`${category.name} · ${currency}`}</Progress.Label>
              <Progress.Value>
                {() => formatMoney(rest, currency)}
              </Progress.Value>
            </Progress.Root>
          </div>
        ))}
        {!limitsQuery.data?.length && (
          <div className="flex min-h-36 items-center justify-center p-5">
            <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
          </div>
        )}
      </Card.Content>
    </Card.Base>
  );
};
