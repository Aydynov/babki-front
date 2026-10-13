import { accountsQueryOptions } from '@/entities/accounts';
import { usersQueryOptions } from '@/entities/users';
import { ManageAccountsButton } from '@/features/manage-accounts';
import { useSelectedPeriod } from '@/features/select-period';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { groupAccounts } from '../model/account-presentation';
import { AccountRow } from './account-row';

export function Accounts() {
  const { t, i18n } = useTranslation();
  const selectedPeriod = useSelectedPeriod();
  const [openAccountIds, setOpenAccountIds] = useState<string[]>([]);
  const accountsQuery = useQuery(accountsQueryOptions.findAll({
    toDate: selectedPeriod.toDate,
  }));
  const userQuery = useQuery(usersQueryOptions.me());
  const loading = accountsQuery.isLoading || userQuery.isLoading;
  const unavailable = !accountsQuery.data || !userQuery.data;
  const groups = groupAccounts(accountsQuery.data ?? [], userQuery.data?.defaultCurrency ?? '', i18n.language);
  const accountNames = new Map((accountsQuery.data ?? []).map((account) => [account._id, account.name]));
  const retry = () => {
    accountsQuery.refetch().catch(() => undefined);
    userQuery.refetch().catch(() => undefined);
  };

  return (
    <Card.Base className="flex w-full min-w-0 max-w-xl flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Typography.Title3 className="text-muted-foreground uppercase">{t('accounts.title')}</Typography.Title3>
        <Card.Controls><ManageAccountsButton /></Card.Controls>
      </div>

      {loading && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <span className="sr-only">{t('accounts.loading')}</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {(accountsQuery.isError || userQuery.isError) && (
        <QueryError
          compact={!unavailable}
          message={t('accounts.errors.load')}
          onRetry={retry}
        />
      )}

      {!loading && !unavailable && groups.length === 0 && (
        <Typography.Body2 className="text-muted-foreground">{t('accounts.empty')}</Typography.Body2>
      )}

      {!loading && !unavailable && groups.map((group) => (
        <section key={group.type} className="flex min-w-0 flex-col gap-2">
          <h3 className="text-body-2 text-muted-foreground">
            {t(`accounts.groups.${group.type}`)}
          </h3>
          {group.accounts.map((account) => (
            <AccountRow
              key={account._id}
              account={account}
              accountNames={accountNames}
              period={selectedPeriod}
              open={openAccountIds.includes(account._id)}
              onOpenChange={(open) => setOpenAccountIds((ids) => (
                open ? [...ids, account._id] : ids.filter((id) => id !== account._id)
              ))}
            />
          ))}
        </section>
      ))}
    </Card.Base>
  );
}
