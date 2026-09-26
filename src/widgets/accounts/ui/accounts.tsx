import { accountsQueryOptions } from '@/entities/accounts';
import { ManageAccountsButton } from '@/features/manage-accounts';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export function Accounts() {
  const { t } = useTranslation();
  const selectedPeriod = useSelectedPeriod();
  const accountsQuery = useQuery(accountsQueryOptions.findAll({
    toDate: selectedPeriod.toDate,
  }));

  return (
    <Card.Base className="flex w-full min-w-0 max-w-xl flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Typography.Title3 className="text-muted-foreground uppercase">{t('accounts.title')}</Typography.Title3>
        <Card.Controls><ManageAccountsButton /></Card.Controls>
      </div>

      {accountsQuery.isLoading && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <span className="sr-only">{t('accounts.loading')}</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {accountsQuery.isError && (
        <Typography.Body2 className="text-destructive" role="alert">
          {t('accounts.errors.load')}
        </Typography.Body2>
      )}

      {accountsQuery.data?.length === 0 && (
        <Typography.Body2 className="text-muted-foreground">{t('accounts.empty')}</Typography.Body2>
      )}

      {accountsQuery.data && accountsQuery.data.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {accountsQuery.data.map((account) => (
            <div
              key={account._id}
              className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-2.5"
            >
              <div className="min-w-0">
                <Typography.Body2 className="truncate">{account.name}</Typography.Body2>
                <Typography.Caption1 className="text-muted-foreground">
                  {account.type === 'balance' ? t('accounts.types.balance') : t('accounts.types.saving')}
                  {account.archivedAt ? ` · ${t('accounts.status.archivedShort')}` : ''}
                </Typography.Caption1>
              </div>
              <Typography.Body1 className="shrink-0">
                {formatMoney(account.amount, account.currency)}
              </Typography.Body1>
            </div>
          ))}
        </div>
      )}
    </Card.Base>
  );
}
