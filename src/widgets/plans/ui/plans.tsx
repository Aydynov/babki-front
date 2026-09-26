import { plansQueryOptions, type Plan } from '@/entities/plans';
import { CreatePlanButton } from '@/features/create-plan';
import { PlanDetailsDialog } from '@/features/manage-plan';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table } from '@/shared/ui/table';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import { type FC, useState } from 'react';

const locale = i18next.language;

const formatDate = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const rowClassName = `
  grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1
  sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-0
`;

export const Plans: FC = () => {
  const plansQuery = useQuery(
    plansQueryOptions.findAll({ status: 'active', limit: 100 }),
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <Card.Base aria-busy={plansQuery.isLoading} className="min-h-64">
      {plansQuery.isLoading && <span className="sr-only">Загрузка...</span>}
      <Card.Header>
        <Card.Title>Планирование</Card.Title>
        <Card.Controls>
          <CreatePlanButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0">
        {plansQuery.isLoading && (
          <Table.Base>
            <Table.Body>
              {['first', 'second', 'third'].map((row) => (
                <Table.Row key={row}>
                  <div className={rowClassName}>
                    <Table.Cell className="min-w-0"><Skeleton className="h-4 w-32" /></Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-1 row-start-2 pt-0 text-body-2 text-muted-foreground
                        sm:col-auto sm:row-auto sm:pt-5
                      `}
                    >
                      <Skeleton className="h-4 w-24" />
                    </Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-2 row-span-2 row-start-1 text-right
                        sm:col-auto sm:row-auto sm:row-span-1
                      `}
                    >
                      <Skeleton className="ml-auto h-4 w-20" />
                    </Table.Cell>
                  </div>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Base>
        )}
        {!plansQuery.isLoading && plansQuery.isError && plansQuery.data === undefined && (
          <QueryError onRetry={() => {
            plansQuery.refetch().catch(() => undefined);
          }}
          />
        )}
        {!plansQuery.isLoading && plansQuery.isError && plansQuery.data !== undefined && (
          <QueryError
            compact
            onRetry={() => {
              plansQuery.refetch().catch(() => undefined);
            }}
          />
        )}
        {!plansQuery.isLoading && plansQuery.data !== undefined && !plansQuery.data.items.length && (
          <div className="flex min-h-36 items-center justify-center px-5 py-3 text-muted-foreground">
            Нет активных планов
          </div>
        )}
        {!plansQuery.isLoading && !!plansQuery.data?.items.length && (
          <Table.Base>
            <Table.Body>
              {plansQuery.data.items.map((plan) => (
                <Table.Row
                  key={plan._id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:bg-muted"
                  onClick={() => setSelectedPlan(plan)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPlan(plan);
                    }
                  }}
                >
                  <div className={rowClassName}>
                    <Table.Cell className="min-w-0 break-words">{plan.description}</Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-1 row-start-2 pt-0 text-body-2 text-muted-foreground
                        sm:col-auto sm:row-auto sm:pt-5
                      `}
                    >
                      {formatDate.format(new Date(plan.targetDate))}
                    </Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-2 row-span-2 row-start-1 text-right
                        sm:col-auto sm:row-auto sm:row-span-1
                      `}
                    >
                      {formatMoney(plan.amount, plan.currency)}
                    </Table.Cell>
                  </div>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Base>
        )}
      </Card.Content>

      <PlanDetailsDialog plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </Card.Base>
  );
};
