import { transfersQueryOptions } from '@/entities/transfers';
import { accountsQueryOptions } from '@/entities/accounts';
import {
  CreateTransferButton,
  DeleteTransferButton,
  EditTransferButton,
} from '@/features/manage-transfer';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export function Transfers() {
  const { t } = useTranslation();
  const selectedPeriod = useSelectedPeriod();
  const query = useQuery(transfersQueryOptions.findAll(selectedPeriod));
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const accountNames = new Map((accountsQuery.data ?? []).map((account) => [account._id, account.name]));

  return (
    <Card.Base className="flex min-w-0 flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Typography.Title3 className="text-muted-foreground uppercase">{t('transfers.title')}</Typography.Title3>
        <Card.Controls><CreateTransferButton /></Card.Controls>
      </div>
      {(query.isLoading || accountsQuery.isLoading) && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <span className="sr-only">{t('transfers.loading')}</span>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {(query.isError || accountsQuery.isError) && (
        <Typography.Body2 className="text-destructive" role="alert">
          {t('transfers.errors.load')}
        </Typography.Body2>
      )}
      {!accountsQuery.isLoading && query.data?.items.length === 0 && (
        <Typography.Body2 className="text-muted-foreground">{t('transfers.empty')}</Typography.Body2>
      )}
      {!accountsQuery.isLoading && accountsQuery.data && query.data?.items.map((transfer) => (
        <div
          key={transfer._id}
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <Typography.Body2>
              {accountNames.get(transfer.source.accountId) ?? transfer.source.accountId}
              {' → '}
              {accountNames.get(transfer.destination.accountId) ?? transfer.destination.accountId}
            </Typography.Body2>
            <Typography.Body2>
              {formatMoney(transfer.source.amount, transfer.source.currency)}
              {' → '}
              {formatMoney(transfer.destination.amount, transfer.destination.currency)}
            </Typography.Body2>
            <Typography.Caption1 className="text-muted-foreground">
              1
              {' '}
              {transfer.effectiveRate.baseCurrency}
              {' = '}
              {transfer.effectiveRate.rate.toLocaleString('ru-RU')}
              {' '}
              {transfer.effectiveRate.quoteCurrency}
              {' · '}
              {format(transfer.transactionDate, 'd MMMM yyyy', { locale: ru })}
              {transfer.description ? ` · ${transfer.description}` : ''}
            </Typography.Caption1>
          </div>
          <div className="flex gap-1">
            <EditTransferButton transfer={transfer} />
            <DeleteTransferButton transfer={transfer} />
          </div>
        </div>
      ))}
    </Card.Base>
  );
}
