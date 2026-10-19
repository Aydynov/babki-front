import type { Account } from '@/entities/accounts';
import { useTransactionsQueryOptions } from '@/entities/transactions';
import { useTransfersQueryOptions } from '@/entities/transfers';
import { ManageAccountsButton } from '@/features/manage-accounts';
import { CreateTransferButton, DeleteTransferButton, EditTransferButton } from '@/features/manage-transfer';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { LucideX } from 'lucide-react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { HistoryTable } from '@/shared/ui/history-table';
import { getTransferEffects } from '../model/account-presentation';

interface AccountDetailsDialogProps {
  account: Account;
  accountNames: Map<string, string>;
  period: { fromDate: string; toDate: string };
  finalFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onUnavailable: () => void;
}

export function AccountDetailsDialog({
  account, accountNames, period, finalFocus, onClose, onUnavailable,
}: AccountDetailsDialogProps) {
  const transfersQueryOptions = useTransfersQueryOptions();
  const transactionsQueryOptions = useTransactionsQueryOptions();
  const { t, i18n } = useTranslation();
  const query = { ...period, accountId: account._id };
  const transactions = useQuery(transactionsQueryOptions.accountHistory(query));
  const transfers = useQuery(transfersQueryOptions.accountHistory(query));
  const effects = new Map(getTransferEffects(transfers.data ?? [], account._id).map((effect) => [effect._id, effect]));
  const formatDate = (value: string) => new Date(value).toLocaleDateString(i18n.language);
  const month = new Date(period.fromDate).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const cellClass = 'min-w-0 break-words border-b px-1 py-2 align-top';
  const historyLabels = (title: string) => ({
    loading: t('accounts.details.loading'),
    error: t('accounts.details.error'),
    pagination: t('accounts.details.pagination', { title }),
    previous: t('accounts.details.previous'),
    next: t('accounts.details.next'),
    page: (page: number, pages: number, total: number) => t('accounts.details.page', { page, pages, total }),
  });
  const facts = [
    [t('accounts.details.type'), t(`accounts.types.${account.type}`)],
    [t('accounts.details.currency'), account.currency],
    [t('accounts.details.balance'), formatMoney(account.amount, account.currency, i18n.language)],
    [t('accounts.status.openedAt'), formatDate(account.openedAt)],
    [t('accounts.status.initialAmount'), formatMoney(account.initialAmount, account.currency, i18n.language)],
  ];

  return (
    <Dialog.Base open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="max-w-3xl" finalFocus={finalFocus}>
        <Dialog.Header>
          <div className="min-w-0 break-words">
            <Dialog.Title>{account.name}</Dialog.Title>
            <Dialog.Description>{month}</Dialog.Description>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ManageAccountsButton accountId={account._id} onUnavailable={onUnavailable} />
            <Button.Icon aria-label={t('accounts.management.close')} onClick={onClose}><LucideX /></Button.Icon>
          </div>
        </Dialog.Header>
        <Dialog.Body>
          <dl className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="min-w-0 break-words">
                <dt className="text-body-2 text-muted-foreground">{label}</dt>
                <dd className="text-body-1 font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <HistoryTable
            title={t('accounts.details.transactions')}
            labels={historyLabels(t('accounts.details.transactions'))}
            items={transactions.data ?? []}
            loading={transactions.isLoading}
            error={transactions.isError}
            empty={t('accounts.details.emptyTransactions')}
            onRetry={() => {
              transactions.refetch().catch(() => undefined);
            }}
            headers={[t('accounts.details.date'), t('accounts.details.operation'), t('accounts.details.amount')]}
            renderRow={(item) => (
              <tr key={item._id}>
                <td className={cellClass}>{formatDate(item.transactionDate)}</td>
                <td className={cellClass}>
                  <span>{t(item.type === 'income' ? 'accounts.details.income' : 'accounts.details.expense')}</span>
                  {item.description && <p className="text-muted-foreground">{item.description}</p>}
                  {item.createdByActor && (
                  <p className="text-muted-foreground">
                    Добавил(а):
                    {item.createdByActor.isAnonymized
                      ? 'Удалённый пользователь' : [item.createdByActor.firstName, item.createdByActor.lastName]
                        .filter(Boolean).join(' ')}
                  </p>
                  )}
                </td>
                <td className={`${cellClass}
                    tabular-nums ${item.type === 'income' ? 'text-success' : 'text-destructive'}`}
                >
                  {item.type === 'income' ? '+' : '−'}
                  {formatMoney(item.amount, item.currency, i18n.language)}
                </td>
              </tr>
            )}
          />
          <HistoryTable
            title={t('transfers.title')}
            labels={historyLabels(t('transfers.title'))}
            action={account.archivedAt === null
              ? <CreateTransferButton initialSourceAccountId={account._id} /> : undefined}
            items={transfers.data ?? []}
            loading={transfers.isLoading}
            error={transfers.isError}
            empty={t('accounts.history.empty')}
            onRetry={() => {
              transfers.refetch().catch(() => undefined);
            }}
            headers={[t('accounts.details.date'), t('accounts.details.counterparty'), t('accounts.details.amount')]}
            renderRow={(item) => {
              const effect = effects.get(item._id)!;
              return (
                <tr key={item._id}>
                  <td className={cellClass}>{formatDate(item.transactionDate)}</td>
                  <td className={cellClass}>
                    {accountNames.get(effect.counterpartyId) ?? t('accounts.history.otherAccount')}
                  </td>
                  <td className={cellClass}>
                    <span className={`tabular-nums ${effect.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {effect.amount > 0 ? '+' : ''}
                      {formatMoney(effect.amount, effect.currency, i18n.language)}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <EditTransferButton transfer={item} />
                      <DeleteTransferButton transfer={item} />
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Base>
  );
}
