import { debtsQueryOptions, type Debt } from '@/entities/debts';
import { CreateDebtButton } from '@/features/create-debt';
import { DebtDetailsDialog } from '@/features/manage-debt';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table } from '@/shared/ui/table';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

const rowClassName = `
  grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1
  sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-0
`;

export const Debts: FC = () => {
  const debtsQuery = useQuery(
    debtsQueryOptions.findAll({ status: 'active', limit: 5 }),
  );
  const { t } = useTranslation();
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  if (debtsQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="min-h-64">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>{t('debts.title')}</Card.Title>
          <Card.Controls>
            <CreateDebtButton />
          </Card.Controls>
        </Card.Header>
        <Card.Content className="px-0">
          <Table.Base>
            <Table.Body>
              {['first', 'second', 'third'].map((row) => (
                <Table.Row key={row}>
                  <div className={rowClassName}>
                    <Table.Cell className="min-w-0"><Skeleton className="h-4 w-28" /></Table.Cell>
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
        </Card.Content>
      </Card.Base>
    );
  }

  if (debtsQuery.isError && debtsQuery.data === undefined) {
    return (
      <Card.Base className="min-h-64">
        <QueryError onRetry={() => {
          debtsQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  return (
    <Card.Base className="min-h-64">
      <Card.Header>
        <Card.Title>{t('debts.title')}</Card.Title>
        <Card.Controls>
          <CreateDebtButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0">
        {debtsQuery.isError && (
        <QueryError
          compact
          onRetry={() => {
            debtsQuery.refetch().catch(() => undefined);
          }}
        />
        )}
        <Table.Base>
          <Table.Body>
            {debtsQuery.data?.items.map((debt) => (
              <Table.Row
                key={debt._id}
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-colors hover:bg-muted"
                onClick={() => setSelectedDebt(debt)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedDebt(debt);
                  }
                }}
              >
                <div className={rowClassName}>
                  <Table.Cell className="min-w-0 break-words">{debt.debtor}</Table.Cell>
                  <Table.Cell
                    className={`
                      col-start-1 row-start-2 pt-0 text-body-2 text-muted-foreground
                      sm:col-auto sm:row-auto sm:pt-5
                    `}
                    title={debt.dueDate && format(new Date(debt.dueDate), 'P', { locale: ru })}
                  >
                    {debt.dueDate && format(new Date(debt.dueDate), 'LLLL d, y', { locale: ru })}
                  </Table.Cell>
                  <Table.Cell
                    className={`
                      col-start-2 row-span-2 row-start-1 text-right
                      sm:col-auto sm:row-auto sm:row-span-1
                    `}
                  >
                    {formatMoney(debt.remainingAmount, debt.currency)}
                  </Table.Cell>
                </div>
              </Table.Row>
            ))}
            {!debtsQuery.data?.items.length && (
              <div className="w-fit m-auto p-5">
                <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
              </div>
            )}
          </Table.Body>
        </Table.Base>
      </Card.Content>

      <DebtDetailsDialog debt={selectedDebt} onClose={() => setSelectedDebt(null)} />
    </Card.Base>
  );
};
