import { useBudgetScope } from '@/entities/budgets';
import { spacesQueryOptions } from '@/entities/spaces';
import { actorLabel } from '@/shared/lib/actor-label';
import { ExpenseCategoryBadge } from '@/entities/expense-categories';
import { type Expense, useExpensesQueryOptions } from '@/entities/expenses';
import {
  CreateExpenseButton,
  ExpenseActions,
  ExpenseDetailsDialog,
} from '@/features/manage-expense';
import {
  useIsCurrentPeriod,
  useSelectedPeriod,
} from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { CollectionFilters, CollectionPagination } from '@/shared/ui/collection';
import { Button } from '@/shared/ui/button';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table } from '@/shared/ui/table';
import {
  Body1,
  Body2,
} from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

const mobileTableClassName = `
  overflow-visible
  [&>[data-slot=table]]:block md:[&>[data-slot=table]]:table
`;

const mobileBodyClassName = 'block space-y-3 px-3 pb-3 md:table-row-group md:space-y-0 md:p-0';

const mobileRowClassName = `
  block overflow-hidden rounded-lg border last-of-type:border
  md:table-row md:overflow-visible md:rounded-none md:border-x-0 md:border-t-0 md:last-of-type:border-0
`;

const getRowGridClassName = (withActions: boolean) => `
  grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 p-4
  md:items-center md:gap-0 md:p-0
  ${withActions
    ? 'md:grid-cols-[repeat(4,minmax(0,170px))_minmax(48px,1fr)]'
    : 'md:grid-cols-[repeat(4,minmax(0,170px))]'}
`;

const ExpensesContent: FC = () => {
  const expensesQueryOptions = useExpensesQueryOptions();
  const [selection, setSelection] = useState<{ expense: Expense; mode: 'view' | 'edit' } | null>(null);
  const finalFocus = useRef<HTMLElement | null>(null);
  const openDetails = (expense: Expense, mode: 'view' | 'edit', trigger: HTMLElement | null) => {
    finalFocus.current = trigger;
    setSelection({ expense, mode });
  };
  const scope = useBudgetScope();
  const members = useQuery(spacesQueryOptions.allMembers(scope.userId, scope.spaceId));
  const [participantId, setParticipantId] = useState('');
  const [page, setPage] = useState(1);
  const selectedPeriod = useSelectedPeriod();
  const isCurrentPeriod = useIsCurrentPeriod();
  const rowGridClassName = getRowGridClassName(isCurrentPeriod);
  const expensesQuery = useQuery(
    expensesQueryOptions.findAll({
      ...selectedPeriod, participantId: participantId || undefined, page, limit: 20,
    }),
  );
  const { t } = useTranslation();

  if (expensesQuery.isLoading && !selection) {
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

  if (expensesQuery.isError && expensesQuery.data === undefined && !selection) {
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
        <div className="pb-3">
          <CollectionFilters
            className="border-y-0 px-3 md:border-y md:px-5"
            filters={[{
              label: 'Участник расхода',
              value: participantId,
              disabled: members.isLoading,
              options: [
                { value: '', label: 'Все участники' },
                ...(members.data ?? []).map((member) => ({
                  value: member.userId,
                  label: [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Участник',
                })),
                ...(expensesQuery.data?.items ?? []).filter((expense, index, items) => (
                  !members.data?.some((member) => member.userId === expense.participantId)
                && items.findIndex((item) => item.participantId === expense.participantId) === index
                )).flatMap((expense) => (expense.participantId ? [{
                  value: expense.participantId,
                  label: expense.participantActor ? actorLabel(expense.participantActor) : 'Участник',
                }] : [])),
              ],
              onChange: (value) => {
                setParticipantId(value);
                setPage(1);
              },
            }]}
          />
          {members.isError && (
            <p role="alert" className="px-3 pt-2 text-body-2 text-destructive md:px-5">
              Не удалось загрузить участников
            </p>
          )}
        </div>
        {expensesQuery.isError && (
        <QueryError
          compact
          onRetry={() => {
            expensesQuery.refetch().catch(() => undefined);
          }}
        />
        )}
        <Table.Base className={mobileTableClassName}>
          <Table.Body className={mobileBodyClassName}>
            {expensesQuery.data?.items.map((expense) => {
              const {
                _id: expenseId, amount, currency, transactionDate, merchant, category, description,
              } = expense;

              return (
                <Table.Row
                  key={expenseId}
                  className={`${mobileRowClassName} cursor-pointer`}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('button, a, [role="menuitem"]')) return;
                    openDetails(expense, 'view', event.currentTarget.querySelector('button[data-expense-details]'));
                  }}
                >
                  <div className={rowGridClassName}>
                    <Table.Cell className="block min-w-0 p-0 md:table-cell md:p-5">
                      <ExpenseCategoryBadge color={category.color}>{category.name}</ExpenseCategoryBadge>
                      {expense.categoryUnavailable && (
                        <Button.Base
                          variant="outline"
                          disabled={expensesQuery.isFetching}
                          onClick={(event) => {
                            event.stopPropagation();
                            expensesQuery.refetch().catch(() => undefined);
                          }}
                        >
                          Загрузить категорию повторно
                        </Button.Base>
                      )}
                    </Table.Cell>
                    <Table.Cell
                      className="col-span-2 block min-w-0 p-0 md:col-span-1 md:table-cell md:p-5"
                    >
                      <div className="flex min-w-0 flex-col items-start gap-1 break-words">
                        <button
                          type="button"
                          data-expense-details
                          className="cursor-pointer text-left break-words focus-visible:outline-2"
                          aria-label={t('expenses.details.open', { description: description || category.name })}
                          onClick={(event) => openDetails(expense, 'view', event.currentTarget)}
                        >
                          {description || <Body1 className="text-muted-foreground">Нет описания</Body1>}
                        </button>
                        {expense.createdByActor && (
                          <Body2 className="text-muted-foreground">
                            Добавил(а):
                            {' '}
                            {actorLabel(expense.createdByActor)}
                          </Body2>
                        )}
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
                      <ExpenseActions
                        expense={expense}
                        onEdit={(trigger) => openDetails(expense, 'edit', trigger)}
                      />
                    </Table.Cell>
                    )}
                  </div>
                </Table.Row>
              );
            })}
            {!expensesQuery.data?.items.length && (
            <div className="m-auto w-fit p-5">
              <Body1 className="text-muted-foreground">Данные отсутствуют</Body1>
            </div>
            )}
          </Table.Body>
        </Table.Base>
        <CollectionPagination
          className="border-t-0 px-3 md:border-t md:px-5"
          page={page}
          total={expensesQuery.data?.total}
          limit={20}
          pending={expensesQuery.isFetching}
          onPageChange={setPage}
        />
      </Card.Content>
      {selection && (
        <ExpenseDetailsDialog
          key={selection.expense._id}
          expense={expensesQuery.data?.items.find(({ _id }) => _id === selection.expense._id) ?? selection.expense}
          initialMode={selection.mode}
          currentPeriod={isCurrentPeriod}
          finalFocus={finalFocus}
          onClose={() => setSelection(null)}
          onRetryCategory={() => {
            expensesQuery.refetch().catch(() => undefined);
          }}
        />
      )}
    </Card.Base>
  );
};

export const Expenses: FC = () => {
  const scope = useBudgetScope();
  return <ExpensesContent key={`${scope.userId}:${scope.spaceId}`} />;
};
