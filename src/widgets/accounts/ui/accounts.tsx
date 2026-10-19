import { useAccountsQueryOptions } from '@/entities/accounts';
import { usersQueryOptions } from '@/entities/users';
import { CreateAccountButton } from '@/features/manage-accounts';
import { useSelectedPeriod } from '@/features/select-period';
import { Button } from '@/shared/ui/button';
import { LucideArchive, LucideArrowLeft } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { groupAccounts } from '../model/account-presentation';
import { AccountDetailsDialog } from './account-details-dialog';
import { AccountRow } from './account-row';

export function Accounts() {
  const accountsQueryOptions = useAccountsQueryOptions();
  const { t, i18n } = useTranslation();
  const selectedPeriod = useSelectedPeriod();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<'active' | 'archived'>('active');
  const modeTrigger = useRef<HTMLButtonElement | null>(null);
  const detailsTrigger = useRef<HTMLButtonElement | null>(null);
  const [openAccountIds, setOpenAccountIds] = useState<string[]>([]);
  const accountsQuery = useQuery(accountsQueryOptions.findAll({
    toDate: selectedPeriod.toDate,
  }));
  const userQuery = useQuery(usersQueryOptions.me());
  const loading = accountsQuery.isLoading || userQuery.isLoading;
  const unavailable = !accountsQuery.data || !userQuery.data;
  const groups = groupAccounts(accountsQuery.data ?? [], userQuery.data?.defaultCurrency ?? '', i18n.language, mode);
  const selectedAccount = accountsQuery.data?.find((account) => account._id === selectedAccountId);
  const accountNames = new Map((accountsQuery.data ?? []).map((account) => [account._id, account.name]));
  const retry = () => {
    accountsQuery.refetch().catch(() => undefined);
    userQuery.refetch().catch(() => undefined);
  };

  return (
    <Card.Base className="flex w-full min-w-0 max-w-xl flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Typography.Title3 className="text-muted-foreground uppercase">
          {t(mode === 'active' ? 'accounts.title' : 'accounts.archive.title')}
        </Typography.Title3>
        <Card.Controls>
          <Button.Icon
            ref={modeTrigger}
            aria-label={t(mode === 'active' ? 'accounts.archive.title' : 'accounts.archive.back')}
            onClick={() => {
              setSelectedAccountId(null);
              setMode((current) => (current === 'active' ? 'archived' : 'active'));
            }}
          >
            {mode === 'active' ? <LucideArchive /> : <LucideArrowLeft />}
          </Button.Icon>
          <CreateAccountButton hidden={mode === 'archived'} />
        </Card.Controls>
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
        <Typography.Body2 className="text-muted-foreground">
          {t(mode === 'active' ? 'accounts.empty' : 'accounts.archive.empty')}
        </Typography.Body2>
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
              onDetailsOpen={(trigger) => {
                detailsTrigger.current = trigger;
                setSelectedAccountId(account._id);
              }}
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
      {selectedAccount && (
        <AccountDetailsDialog
          key={`${selectedAccountId}:${selectedPeriod.fromDate}:${selectedPeriod.toDate}`}
          account={selectedAccount}
          accountNames={accountNames}
          period={selectedPeriod}
          finalFocus={detailsTrigger}
          onClose={() => setSelectedAccountId(null)}
          onUnavailable={() => {
            detailsTrigger.current = modeTrigger.current;
            setSelectedAccountId(null);
            // Restore focus after all nested dialogs have run their unmount focus cleanup.
            requestAnimationFrame(() => modeTrigger.current?.focus());
          }}
        />
      )}
    </Card.Base>
  );
}
