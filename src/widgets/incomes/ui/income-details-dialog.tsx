import { actorLabel } from '@/shared/lib/actor-label';
import { useState } from 'react';
import { IncomeActions } from '@/features/manage-income';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useIncomesQueryOptions } from '@/entities/incomes';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { HistoryTable } from '@/shared/ui/history-table';
import { useQuery } from '@tanstack/react-query';
import { LucideX } from 'lucide-react';
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
  const cellClass = 'min-w-0 break-words border-b px-1 py-2 align-top';

  return (
    <Dialog.Base open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="max-w-3xl" finalFocus={finalFocus}>
        <Dialog.Header>
          <div className="min-w-0 break-words">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{month}</Dialog.Description>
          </div>
          <Button.Icon aria-label={t('incomes.details.close')} onClick={onClose}><LucideX /></Button.Icon>
        </Dialog.Header>
        <Dialog.Body>
          {unavailableNotice && <p role="status">Доход уже удалён или недоступен. Список обновляется.</p>}
          <HistoryTable
            title={title}
            hideTitle
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
              t('incomes.details.account'), t('incomes.details.amount'),
            ]}
            renderRow={(item) => (
              <tr key={item._id}>
                <td className={cellClass}>{new Date(item.transactionDate).toLocaleDateString(i18n.language)}</td>
                <td className={cellClass}>
                  {item.description || t('incomes.details.unknownSource')}
                  {item.createdByActor && (
                  <p className="text-muted-foreground">
                    Добавил(а):
                    {actorLabel(item.createdByActor)}
                  </p>
                  )}
                  <IncomeActions income={item} onUnavailable={() => setUnavailableNotice(true)} />
                </td>
                <td className={cellClass}>{names.get(item.accountId) ?? t('incomes.details.unknownAccount')}</td>
                <td className={`${cellClass} tabular-nums`}>{formatMoney(item.amount, currency, i18n.language)}</td>
              </tr>
            )}
          />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Base>
  );
}
