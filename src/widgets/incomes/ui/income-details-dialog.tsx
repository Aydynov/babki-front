import { actorLabel } from '@/shared/lib/actor-label';
import { useState } from 'react';
import { IncomeActions } from '@/features/manage-income';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useIncomesQueryOptions } from '@/entities/incomes';
import { formatMoney } from '@/shared/lib/currency';
import { Dialog } from '@/shared/ui/dialog';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { HistoryTable } from '@/shared/ui/history-table';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface IncomeDetailsDialogProps {
  currency: string;
  period: { fromDate: string; toDate: string };
  finalFocus: () => HTMLElement | null;
  onClose: () => void;
}

export function IncomeDetailsDialog({
  currency, period, finalFocus, onClose,
}: IncomeDetailsDialogProps) {
  const [unavailableNotice, setUnavailableNotice] = useState(false);
  const accountsQueryOptions = useAccountsQueryOptions();
  const incomesQueryOptions = useIncomesQueryOptions();
  const { t, i18n } = useTranslation();
  const history = useQuery(incomesQueryOptions.currencyHistory({ ...period, currency }));
  const accounts = useQuery(accountsQueryOptions.findAll());
  const names = new Map((accounts.data ?? []).map((account) => [account._id, account.name]));
  const title = t('incomes.details.title', { currency });
  const month = new Date(period.fromDate).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const cellClass = 'min-w-0 break-words px-1 sm:border-b sm:py-2 sm:align-top';

  return (
    <ScrollDialog.Base open onOpenChange={(open) => !open && onClose()}>
      <ScrollDialog.Content className="max-w-3xl" finalFocus={finalFocus}>
        <ScrollDialog.Layout
          title={title}
          closeLabel={t('incomes.details.close')}
          onClose={onClose}
        >
          <Dialog.Description>{month}</Dialog.Description>
          {unavailableNotice && <p role="status">Доход уже удалён или недоступен. Список обновляется.</p>}
          <div className="[&_thead]:sr-only sm:[&_thead]:not-sr-only sm:[&_th:last-child]:w-20">
            <HistoryTable
              title={title}
              hideTitle
              paginationVariant="collection"
              items={history.data ?? []}
              loading={history.isLoading}
              error={history.isError}
              empty={t('incomes.history.empty')}
              onRetry={() => {
                history.refetch().catch(() => undefined);
              }}
              labels={{
                loading: t('incomes.details.loading'),
                error: t('incomes.details.error'),
                pagination: t('incomes.details.pagination'),
                previous: t('incomes.details.previous'),
                next: t('incomes.details.next'),
                page: (page, pages, total) => t('incomes.details.page', { page, pages, total }),
              }}
              headers={[
                t('incomes.details.date'), t('incomes.details.source'),
                t('incomes.details.account'), t('incomes.details.amount'), 'Действия',
              ]}
              renderRow={(item) => (
                <tr
                  key={item._id}
                  className="
                    grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 border-b py-3 last:border-b-0
                    sm:table-row sm:border-0 sm:py-0 sm:[&:last-child>td]:border-b-0
                  "
                >
                  <td className={`${cellClass} col-start-1 row-start-3 text-muted-foreground sm:text-foreground`}>
                    {new Date(item.transactionDate).toLocaleDateString(i18n.language)}
                  </td>
                  <td className={`${cellClass} col-start-1 row-start-1`}>
                    {item.description || t('incomes.details.unknownSource')}
                    {item.createdByActor && (
                    <p className="text-muted-foreground">
                      Добавил(а):
                      {' '}
                      {actorLabel(item.createdByActor)}
                    </p>
                    )}
                  </td>
                  <td className={`${cellClass} col-start-1 row-start-2 text-muted-foreground sm:text-foreground`}>
                    {names.get(item.accountId) ?? t('incomes.details.unknownAccount')}
                  </td>
                  <td className={`${cellClass} col-start-2 row-start-1 text-right tabular-nums`}>
                    {formatMoney(item.amount, currency, i18n.language)}
                  </td>
                  <td className={`${cellClass} col-start-3 row-span-3 row-start-1 text-right`}>
                    <IncomeActions income={item} onUnavailable={() => setUnavailableNotice(true)} />
                  </td>
                </tr>
              )}
            />
          </div>
        </ScrollDialog.Layout>
      </ScrollDialog.Content>
    </ScrollDialog.Base>
  );
}
