import { actorLabel } from '@/shared/lib/actor-label';
import { useCanManageRecord } from '@/entities/budgets';
import { type useCancelDebtRepaymentMutation, type Debt } from '@/entities/debts';
import { QueryError } from '@/shared/ui/query-error';
import { useDebtTransactionsQueryOptions } from '@/entities/debt-transactions';
import { formatMoney } from '@/shared/lib/currency';
import { cn } from '@/shared/lib/shadcn-utils';
import { Button } from '@/shared/ui/button';
import { Menu } from '@base-ui/react';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Icon } from '@/shared/ui/icon';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import {
  LucideArchive, LucideCheck, LucidePencil, LucideTrash2,
} from 'lucide-react';
import { type FC, type RefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RepaymentCancelButton } from './repayment-cancel-button';

const locale = i18next.language;

const formatDate = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface DebtViewProps {
  debt: Debt;
  pending: boolean;
  cancel: ReturnType<typeof useCancelDebtRepaymentMutation>;
  actionRef: RefObject<HTMLButtonElement | null>;
  repayRef: RefObject<HTMLButtonElement | null>;
  onArchive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRepay: () => void;
  onClose: () => void;
}

export const DebtView: FC<DebtViewProps> = ({
  debt,
  pending,
  cancel,
  actionRef,
  repayRef,
  onArchive,
  onEdit,
  onDelete,
  onRepay,
  onClose,
}) => {
  const { t } = useTranslation();
  const canManage = useCanManageRecord('createdBy' in debt ? debt.createdBy : undefined);
  const mutable = canManage && !debt.archivedAt;
  const [page, setPage] = useState(1);
  const history = useQuery(
    useDebtTransactionsQueryOptions().findAll(debt._id, { limit: 10, page }),
  );
  const { data: transactionsData, isLoading: transactionsLoading } = history;
  const transactions = transactionsData?.items ?? [];

  const menuClass = 'flex h-8 items-center gap-2 rounded-md px-2 text-sm outline-none '
    + 'data-highlighted:bg-accent data-disabled:opacity-50';

  return (
    <ScrollDialog.Layout
      title={t('debts.details.title')}
      closeLabel={t('debts.details.close')}
      onClose={onClose}
      closeDisabled={pending}
      headerActions={mutable ? (
        <Menu.Root>
          <Menu.Trigger
            ref={actionRef}
            render={<Button.Icon />}
            aria-label={t('debts.details.actions.menu')}
            title={t('debts.details.actions.menu')}
            disabled={pending}
          >
            <Icon icon="IcDots20" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              align="end"
              sideOffset={4}
              className="z-50 outline-none"
            >
              <Menu.Popup className="rounded-lg border bg-popover p-1 shadow-md outline-none">
                <Menu.Item className={menuClass} onClick={onEdit}>
                  <LucidePencil className="size-4" />
                  {t('debts.details.actions.edit')}
                </Menu.Item>
                <Menu.Item className={menuClass} onClick={onArchive}>
                  <LucideArchive className="size-4" />
                  {t('debts.details.actions.archive')}
                </Menu.Item>
                <Menu.Item
                  className={`${menuClass} text-destructive`}
                  disabled={!history.isSuccess || (transactionsData?.total ?? 0) > 0}
                  onClick={onDelete}
                >
                  <LucideTrash2 className="size-4" />
                  {t('debts.details.actions.delete')}
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ) : undefined}
      actions={mutable ? (
        <Button.Base
          ref={repayRef}
          onClick={onRepay}
          disabled={pending || debt.remainingAmount <= 0}
        >
          <LucideCheck />
          {t('debts.details.actions.repay')}
        </Button.Base>
      ) : undefined}
    >
      {debt.archivedAt && <Typography.Caption1>Архив · Только чтение</Typography.Caption1>}
      {cancel.isError && (
      <Typography.Caption1 className="text-destructive">
        Действие не подтверждено. Проверьте историю. Финансовая отмена недоступна для архивного счёта.
      </Typography.Caption1>
      )}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.debtor')}
          </Typography.Caption1>
          <Typography.Body2 className="break-words">{debt.debtor}</Typography.Body2>
        </div>
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.status')}
          </Typography.Caption1>
          <Typography.Body2>{t(`debts.status.${debt.status}`)}</Typography.Body2>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Typography.Caption1 className="text-muted-foreground">
          {t('debts.details.fields.description')}
        </Typography.Caption1>
        <Typography.Body2 className={!debt.description ? 'text-muted-foreground' : undefined}>
          {debt.description || '—'}
        </Typography.Body2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.principalAmount')}
          </Typography.Caption1>
          <Typography.Body2>{formatMoney(debt.principalAmount, debt.currency)}</Typography.Body2>
        </div>
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.remainingAmount')}
          </Typography.Caption1>
          <Typography.Body2>{formatMoney(debt.remainingAmount, debt.currency)}</Typography.Body2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.dueDate')}
          </Typography.Caption1>
          <Typography.Body2 className={!debt.dueDate ? 'text-muted-foreground' : undefined}>
            {debt.dueDate ? formatDate.format(new Date(debt.dueDate)) : '—'}
          </Typography.Body2>
        </div>
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.author')}
          </Typography.Caption1>
          <Typography.Body2>{debt.createdByActor ? actorLabel(debt.createdByActor) : '—'}</Typography.Body2>
        </div>
      </div>

      {(!history.isSuccess || (transactionsData?.total ?? 0) > 0) && (
        <div className="flex flex-col gap-3">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.history.title')}
          </Typography.Caption1>

          {history.isError && (
          <QueryError
            compact
            onRetry={() => {
              history.refetch().catch(() => undefined);
            }}
          />
          )}
          {transactionsLoading && (
            <Typography.Body3 className="text-muted-foreground">
              {t('debts.details.history.loading')}
            </Typography.Body3>
          )}

          {!transactionsLoading && !!transactions.length && (
            <div className="flex flex-col divide-y rounded-lg border">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-3 py-3"
                >
                  <div className={cn(
                    'min-w-0 break-words',
                    'cancelledAt' in transaction && transaction.cancelledAt && 'line-through',
                  )}
                  >
                    <Typography.Body3>
                      {formatDate.format(new Date(transaction.transactionDate))}
                    </Typography.Body3>
                    {transaction.description && (
                      <Typography.Caption1 className="text-muted-foreground">
                        {transaction.description}
                      </Typography.Caption1>
                    )}
                  </div>
                  <div className={cn(
                    'flex flex-col items-end gap-1 text-right',
                    'cancelledAt' in transaction && transaction.cancelledAt && 'line-through',
                  )}
                  >
                    <Typography.Body3>{formatMoney(transaction.amount, debt.currency)}</Typography.Body3>
                    {'isIncome' in transaction && (
                      <Typography.Caption1>
                        {transaction.isIncome ? 'Зачисление на счёт' : 'Без поступления'}
                      </Typography.Caption1>
                    )}
                    {'createdByActor' in transaction && (
                      <Typography.Caption1>
                        {actorLabel(transaction.createdByActor)}
                      </Typography.Caption1>
                    )}
                    {'cancelledAt' in transaction && !transaction.cancelledAt && mutable && (
                      <RepaymentCancelButton
                        debtId={debt._id}
                        repayment={transaction}
                        mutation={cancel}
                        disabled={pending}
                      />
                    )}
                  </div>
                  {'cancelledAt' in transaction && transaction.cancelledAt && (
                    <Typography.Caption1 className="col-span-2 text-muted-foreground">
                      Отменено
                      {' '}
                      {formatDate.format(new Date(transaction.cancelledAt))}
                      {transaction.cancelledByActor && ` · ${actorLabel(transaction.cancelledByActor)}`}
                    </Typography.Caption1>
                  )}
                </div>
              ))}
            </div>
          )}
          {(transactionsData?.total ?? 0) > 10 && (
            <div className="flex items-center justify-between gap-2">
              <Button.Base
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Назад
              </Button.Base>
              <span>
                Страница
                {page}
              </span>
              <Button.Base
                variant="outline"
                disabled={page * 10 >= (transactionsData?.total ?? 0)}
                onClick={() => setPage(page + 1)}
              >
                Далее
              </Button.Base>
            </div>
          )}
        </div>
      )}
    </ScrollDialog.Layout>
  );
};
