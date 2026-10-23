import { useAccountsQueryOptions } from '@/entities/accounts';
import { useBudgetScope } from '@/entities/budgets';
import type { Expense } from '@/entities/expenses';
import { ExpenseCategoryBadge } from '@/entities/expense-categories';
import { spacesQueryOptions } from '@/entities/spaces';
import { actorLabel } from '@/shared/lib/actor-label';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { LucidePencil } from 'lucide-react';
import type { FC, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseViewProps {
  expense: Expense;
  canEdit: boolean;
  actionRef: RefObject<HTMLButtonElement | null>;
  onEdit: () => void;
  onClose: () => void;
  onRetryCategory: () => void;
}

export const ExpenseView: FC<ExpenseViewProps> = ({
  expense, canEdit, actionRef, onEdit, onClose, onRetryCategory,
}) => {
  const { t, i18n } = useTranslation();
  const scope = useBudgetScope();
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const members = useQuery(spacesQueryOptions.allMembers(scope.userId, scope.spaceId));
  const account = accounts.data?.find(({ _id }) => _id === expense.accountId);
  const participant = members.data?.find(({ userId }) => userId === expense.participantId);
  const fields = [
    [t('expenses.create.fields.amount'), formatMoney(expense.amount, expense.currency)],
    [t('expenses.create.fields.date'), new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date(expense.transactionDate))],
    [t('expenses.create.fields.account'), account?.name ?? expense.accountId],
    [t('expenses.details.currency'), expense.currency],
    [t('expenses.details.participant'), expense.participantActor ? actorLabel(expense.participantActor)
      : [participant?.firstName, participant?.lastName].filter(Boolean).join(' ') || t('expenses.details.unavailable')],
    [t('expenses.details.author'), actorLabel(expense.createdByActor)],
    [t('expenses.create.fields.merchant'), expense.merchant || '—'],
    [t('expenses.create.fields.description'), expense.description || '—'],
  ];

  return (
    <ScrollDialog.Layout
      title={t('expenses.details.title')}
      closeLabel={t('expenses.details.close')}
      closeRef={actionRef}
      onClose={onClose}
      actions={canEdit ? (
        <Button.Base variant="ghost" onClick={onEdit}>
          <LucidePencil />
          {t('expenses.actions.editLabel')}
        </Button.Base>
      ) : undefined}
    >
      {account?.archivedAt && (
      <Typography.Caption1>{t('expenses.edit.accountArchived')}</Typography.Caption1>
      )}
      <div className="flex flex-col items-start gap-1">
        <Typography.Caption1 className="text-muted-foreground">
          {t('expenses.create.fields.category')}
        </Typography.Caption1>
        <ExpenseCategoryBadge color={expense.category.color}>{expense.category.name}</ExpenseCategoryBadge>
        {expense.categoryUnavailable && (
        <Button.Base variant="outline" onClick={onRetryCategory}>{t('expenses.details.retryCategory')}</Button.Base>
        )}
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-caption-1 text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-wrap text-body-2">{value}</dd>
          </div>
        ))}
      </dl>
      {expense.items.length > 0 && (
        <div className="flex flex-col gap-3">
          <Typography.Caption1 className="text-muted-foreground">{t('expenses.details.items')}</Typography.Caption1>
          <div className="flex flex-col divide-y rounded-lg border">
            {expense.items.map((item, index) => (
              <div key={`${index}-${item.name}`} className="min-w-0 p-3">
                <Typography.Body2>{item.name}</Typography.Body2>
                <dl className="mt-2 grid grid-cols-2 gap-3 text-body-2">
                  <div>
                    <dt className="text-muted-foreground">{t('expenses.itemFields.quantity')}</dt>
                    <dd>{item.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('expenses.itemFields.price')}</dt>
                    <dd>{formatMoney(item.price, expense.currency)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </ScrollDialog.Layout>
  );
};
