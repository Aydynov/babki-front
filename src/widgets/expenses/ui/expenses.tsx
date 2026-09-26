import { ExpenseCategoryBadge } from '@/entities/expense-categories';
import { expensesQueryOptions } from '@/entities/expenses';
import {
  CreateExpenseButton,
  ExpenseActions,
} from '@/features/manage-expense';
import {
  useIsCurrentPeriod,
  useSelectedPeriod,
} from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table } from '@/shared/ui/table';
import {
  Body1,
  Body2,
} from '@/shared/ui/typography';
import { Accordion } from '@base-ui/react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const mobileTableClassName = `
  overflow-visible
  [&>[data-slot=table]]:block md:[&>[data-slot=table]]:table
`;

const mobileBodyClassName = 'block space-y-3 px-3 pb-3 md:table-row-group md:space-y-0 md:p-0';

const mobileRowClassName = `
  block overflow-hidden rounded-lg border last-of-type:border
  md:table-row md:overflow-visible md:rounded-none md:border-x-0 md:border-t-0 md:last-of-type:border-b-0
`;

const getRowGridClassName = (withActions: boolean) => `
  grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 p-4
  md:items-center md:gap-0 md:p-0
  ${withActions
    ? 'md:grid-cols-[repeat(4,minmax(0,170px))_minmax(48px,1fr)]'
    : 'md:grid-cols-[repeat(4,minmax(0,170px))]'}
`;

export const Expenses: FC = () => {
  const selectedPeriod = useSelectedPeriod();
  const isCurrentPeriod = useIsCurrentPeriod();
  const rowGridClassName = getRowGridClassName(isCurrentPeriod);
  const expensesQuery = useQuery(
    expensesQueryOptions.findAll(selectedPeriod),
  );
  const { t } = useTranslation();

  if (expensesQuery.isLoading) {
    return (
      <Card.Base aria-busy="true" className="h-fit min-h-64 min-w-0">
        <span className="sr-only">Загрузка...</span>
        <Card.Header>
          <Card.Title>{t('expenses.title')}</Card.Title>
          {isCurrentPeriod && (
            <Card.Controls>
              <CreateExpenseButton />
            </Card.Controls>
          )}
        </Card.Header>
        <Card.Content className="px-0">
          <Table.Base className={mobileTableClassName}>
            <Table.Body className={mobileBodyClassName}>
              {['first', 'second', 'third'].map((row) => (
                <Table.Row key={row} className={mobileRowClassName}>
                  <div className={rowGridClassName}>
                    <Table.Cell className="block min-w-0 p-0 md:table-cell md:p-5">
                      <Skeleton className="h-5 w-24" />
                    </Table.Cell>
                    <Table.Cell
                      className="col-span-2 block min-w-0 p-0 md:col-span-1 md:table-cell md:p-5"
                    >
                      <Skeleton className="h-4 w-32" />
                    </Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-2 row-start-1 block p-0 text-right
                        md:col-auto md:row-auto md:table-cell md:p-5 md:text-left
                      `}
                    >
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </Table.Cell>
                    <Table.Cell className="block min-w-0 p-0 md:table-cell md:p-5">
                      <Skeleton className="h-4 w-28" />
                    </Table.Cell>
                    {isCurrentPeriod && (
                      <Table.Cell
                        className={`
                          col-start-2 row-start-3 flex justify-end p-0
                          md:col-auto md:row-auto md:py-5 md:pr-5 md:pl-0
                        `}
                      >
                        <Skeleton className="size-7" />
                      </Table.Cell>
                    )}
                  </div>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Base>
        </Card.Content>
      </Card.Base>
    );
  }

  if (expensesQuery.isError && expensesQuery.data === undefined) {
    return (
      <Card.Base className="h-fit min-h-64 min-w-0">
        <QueryError onRetry={() => {
          expensesQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  return (
    <Card.Base className="h-fit min-h-64 min-w-0">
      <Card.Header>
        <Card.Title>{t('expenses.title')}</Card.Title>
        {isCurrentPeriod && (
          <Card.Controls>
            <CreateExpenseButton />
          </Card.Controls>
        )}
      </Card.Header>
      <Card.Content className="px-0">
        {expensesQuery.isError && (
        <QueryError
          compact
          onRetry={() => {
            expensesQuery.refetch().catch(() => undefined);
          }}
        />
        )}
        <Table.Base className={mobileTableClassName}>
          <Accordion.Root render={<Table.Body className={mobileBodyClassName} />}>
            {expensesQuery.data?.items.map((expense) => {
              const {
                _id: expenseId, amount, currency, transactionDate, merchant, category, description, items,
              } = expense;

              return (
                <Accordion.Item key={expenseId} render={<Table.Row className={mobileRowClassName} />}>
                  <div className={rowGridClassName}>
                    <Table.Cell className="block min-w-0 p-0 md:table-cell md:p-5">
                      <ExpenseCategoryBadge color={category.color}>{category.name}</ExpenseCategoryBadge>
                    </Table.Cell>
                    <Table.Cell
                      className="col-span-2 block min-w-0 p-0 md:col-span-1 md:table-cell md:p-5"
                    >
                      <div className="flex min-w-0 flex-col items-start gap-1 break-words">
                        {description}
                        {!!items.length && (
                        <Accordion.Trigger>
                          <Body2 className="text-muted-foreground in-data-panel-open:hidden">
                            {t('expenses.expandItems')}
                          </Body2>
                          <Body2 className="hidden text-muted-foreground in-data-panel-open:block">
                            {t('expenses.collapseItems')}
                          </Body2>
                        </Accordion.Trigger>
                        )}
                        {!description && !items.length && <Body1 className="text-muted-foreground">Нет описания</Body1>}
                      </div>
                    </Table.Cell>
                    <Table.Cell
                      className={`
                        col-start-2 row-start-1 block p-0 text-right
                        md:col-auto md:row-auto md:table-cell md:p-5 md:text-left
                      `}
                    >
                      <div className="flex flex-col gap-1">
                        {formatMoney(amount, currency)}
                        <Body2 className="text-muted-foreground">
                          {transactionDate && format(transactionDate, 'LLLL d, y', { locale: ru })}
                        </Body2>
                      </div>
                    </Table.Cell>
                    <Table.Cell
                      className="block min-w-0 break-words p-0 text-body-2 text-muted-foreground md:table-cell md:p-5"
                    >
                      {merchant || <Body1 className="text-muted-foreground">Место не указано</Body1>}
                    </Table.Cell>
                    {isCurrentPeriod && (
                    <Table.Cell
                      className={`
                        col-start-2 row-start-3 flex justify-end p-0
                        md:col-auto md:row-auto md:py-5 md:pr-5 md:pl-0
                      `}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ExpenseActions expense={expense} />
                    </Table.Cell>
                    )}
                  </div>
                  <Accordion.Panel render={<Table.Base className="border-t px-3 py-2 md:px-5" />}>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>{t('expenses.itemFields.name')}</Table.Head>
                        <Table.Head>{t('expenses.itemFields.quantity')}</Table.Head>
                        <Table.Head>{t('expenses.itemFields.price')}</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {items.map(({ name, quantity, price }) => (
                        <Table.Row key={name}>
                          <Table.Cell>{name}</Table.Cell>
                          <Table.Cell>{quantity}</Table.Cell>
                          <Table.Cell>{formatMoney(price, currency)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
            {!expensesQuery.data?.items.length && (
            <div className="m-auto w-fit p-5">
              <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
            </div>
            )}
          </Accordion.Root>
        </Table.Base>
      </Card.Content>
    </Card.Base>
  );
};
