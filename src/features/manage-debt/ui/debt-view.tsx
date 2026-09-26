import { debtTransactionsQueryOptions } from '@/entities/debt-transactions';
import { type Debt } from '@/entities/debts';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import { LucideCheck, LucidePencil, LucideTrash2 } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalCloseButton } from './modal-close-button';

const locale = i18next.language;

const formatDate = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface DebtViewProps {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
  onRepay: () => void;
  onClose: () => void;
}

export const DebtView: FC<DebtViewProps> = ({
  debt,
  onEdit,
  onDelete,
  onRepay,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery(
    debtTransactionsQueryOptions.findAll(debt._id, { limit: 5 }),
  );
  const transactions = transactionsData?.items ?? [];

  return (
    <div>
      <Dialog.Header>
        <Dialog.Title>{t('debts.details.title')}</Dialog.Title>
        <ModalCloseButton onClick={onClose} label={t('debts.details.close')} />
      </Dialog.Header>

      <Dialog.Body>
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.debtor')}
          </Typography.Caption1>
          <Typography.Body2>{debt.debtor}</Typography.Body2>
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.fields.description')}
          </Typography.Caption1>
          <Typography.Body2 className={!debt.description ? 'text-muted-foreground' : undefined}>
            {debt.description || '—'}
          </Typography.Body2>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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
              {t('debts.details.fields.status')}
            </Typography.Caption1>
            <Typography.Body2>{t(`debts.status.${debt.status}`)}</Typography.Body2>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Typography.Caption1 className="text-muted-foreground">
            {t('debts.details.history.title')}
          </Typography.Caption1>

          {transactionsLoading && (
            <Typography.Body3 className="text-muted-foreground">
              {t('debts.details.history.loading')}
            </Typography.Body3>
          )}

          {!transactionsLoading && !transactions.length && (
            <Typography.Body3 className="text-muted-foreground">
              {t('debts.details.history.empty')}
            </Typography.Body3>
          )}

          {!transactionsLoading && !!transactions.length && (
            <div className="flex flex-col divide-y rounded-lg border">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-start justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <Typography.Body3>
                      {formatDate.format(new Date(transaction.transactionDate))}
                    </Typography.Body3>
                    {transaction.description && (
                      <Typography.Caption1 className="text-muted-foreground">
                        {transaction.description}
                      </Typography.Caption1>
                    )}
                  </div>
                  <Typography.Body3 className="shrink-0">
                    {formatMoney(transaction.amount, debt.currency)}
                  </Typography.Body3>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog.Body>

      <Dialog.Footer className="justify-between">
        <Button.Base variant="destructive" onClick={onDelete}>
          <LucideTrash2 />
          {t('debts.details.actions.delete')}
        </Button.Base>
        <div className="flex flex-wrap gap-2.5">
          <Button.Base variant="outline" onClick={onEdit}>
            <LucidePencil />
            {t('debts.details.actions.edit')}
          </Button.Base>
          <Button.Base onClick={onRepay} disabled={debt.remainingAmount <= 0}>
            <LucideCheck />
            {t('debts.details.actions.repay')}
          </Button.Base>
        </div>
      </Dialog.Footer>
    </div>
  );
};
