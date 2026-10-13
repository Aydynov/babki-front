import type { Account } from '@/entities/accounts';
import { transfersQueryOptions } from '@/entities/transfers';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ExpandIcon } from '@/shared/ui/expand-icon';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { Collapsible } from '@base-ui/react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { getTransferEffects } from '../model/account-presentation';

interface AccountRowProps {
  account: Account;
  accountNames: Map<string, string>;
  period: { fromDate: string; toDate: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountRow({
  account, accountNames, period, open, onOpenChange,
}: AccountRowProps) {
  const { t, i18n } = useTranslation();
  const history = useQuery({
    ...transfersQueryOptions.findAll({
      ...period, accountId: account._id, page: 1, limit: 10,
    }),
    enabled: open,
  });
  const effects = getTransferEffects(history.data?.items ?? [], account._id);
  const retry = () => {
    history.refetch().catch(() => undefined);
  };

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={onOpenChange}
      className="min-w-0 rounded-lg border"
    >
      <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
        <Typography.Body2 className="min-w-0 flex-1 truncate" title={account.name}>
          {account.name}
        </Typography.Body2>
        <Typography.Body1 className="shrink-0 font-semibold tabular-nums">
          {formatMoney(account.amount, account.currency)}
        </Typography.Body1>
        <Collapsible.Trigger
          aria-label={t(open ? 'accounts.history.collapse' : 'accounts.history.expand', { name: account.name })}
          render={<Button.Icon />}
        >
          <ExpandIcon />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Panel className="border-t px-3 py-2.5">
        <Typography.Caption1 className="mb-2 block text-muted-foreground">
          {t('accounts.history.title')}
        </Typography.Caption1>
        {history.isLoading && (
          <div className="flex flex-col gap-2" aria-busy="true">
            <span className="sr-only">{t('transfers.loading')}</span>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {history.isError && (
          <QueryError
            compact
            message={t('transfers.errors.load')}
            onRetry={retry}
          />
        )}
        {history.data && effects.length === 0 && (
          <Typography.Body2 className="text-muted-foreground">{t('accounts.history.empty')}</Typography.Body2>
        )}
        {effects.length > 0 && (
          <ul className="flex flex-col divide-y">
            {effects.map((effect) => (
              <li key={effect._id} className="flex min-w-0 flex-col gap-1 py-2">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <Typography.Body2 className="truncate" title={accountNames.get(effect.counterpartyId)}>
                    {accountNames.get(effect.counterpartyId) ?? t('accounts.history.otherAccount')}
                  </Typography.Body2>
                  <Typography.Body2
                    className={`shrink-0 tabular-nums ${effect.amount > 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {effect.amount > 0 ? '+' : ''}
                    {formatMoney(effect.amount, effect.currency, i18n.language)}
                  </Typography.Body2>
                </div>
                <Typography.Caption1 className="text-muted-foreground">
                  {format(effect.transactionDate, 'd MMM yyyy', { locale: ru })}
                </Typography.Caption1>
              </li>
            ))}
          </ul>
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
