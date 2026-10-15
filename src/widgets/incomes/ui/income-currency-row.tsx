import { incomesQueryOptions } from '@/entities/incomes';
import { CreateIncomeButton } from '@/features/create-income';
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
import { LucideArrowDown, LucideArrowUp } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface IncomeCurrencyRowProps {
  currency: string;
  total: number;
  diff: number;
  period: { fromDate: string; toDate: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetailsOpen: (trigger: HTMLButtonElement) => void;
}

export function IncomeCurrencyRow({
  currency, total, diff, period, open, onOpenChange, onDetailsOpen,
}: IncomeCurrencyRowProps) {
  const { t, i18n } = useTranslation();
  const history = useQuery({ ...incomesQueryOptions.currencyHistory({ ...period, currency }), enabled: open });
  // Preserve the expanded amount-card formatting, including optional currency decimals.
  const formatAmount = new Intl.NumberFormat(i18n.language, {
    style: 'currency', currency, notation: 'standard', minimumFractionDigits: 0,
  });
  const formatDiff = new Intl.NumberFormat(i18n.language, {
    style: 'percent', signDisplay: 'exceptZero', notation: 'compact',
  });
  const DiffIcon = diff > 0 ? LucideArrowUp : LucideArrowDown;

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={onOpenChange}
      className="min-w-0 rounded-lg border"
    >
      <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left focus-visible:outline-2"
          aria-label={t('incomes.details.open', { currency })}
          onClick={(event) => onDetailsOpen(event.currentTarget)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Typography.Body2>{currency}</Typography.Body2>
            {total > 0 && !!diff && (
              <Typography.Body2 className={clsx('flex items-center', diff > 0 ? 'text-success' : 'text-destructive')}>
                {formatDiff.format(diff)}
                <DiffIcon className="ml-1 size-4" strokeWidth={1.75} />
              </Typography.Body2>
            )}
          </span>
          <Typography.Body1 className="min-w-0 break-all text-right font-semibold tabular-nums">
            {formatMoney(total, currency, i18n.language)}
          </Typography.Body1>
        </button>
        <CreateIncomeButton currency={currency} />
        <Collapsible.Trigger
          aria-label={t(open ? 'incomes.history.collapse' : 'incomes.history.expand', { currency })}
          render={<Button.Icon />}
        >
          <ExpandIcon />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Panel className="flex min-w-0 flex-col gap-2.5 px-3 pb-2.5">
        {history.isLoading && (
          <div
            aria-busy="true"
            aria-label={t('incomes.details.loading')}
            className="flex flex-col gap-2"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {history.isError && (
          <QueryError
            compact
            message={t('incomes.details.error')}
            onRetry={() => {
              history.refetch().catch(() => undefined);
            }}
          />
        )}
        {history.data && history.data.length === 0 && (
          <Typography.Body2 className="text-muted-foreground">{t('incomes.history.empty')}</Typography.Body2>
        )}
        {!!history.data?.length && (
          <>
            <div className="table w-full table-fixed">
              {history.data.slice(0, 5).map((item) => (
                <div key={item._id} className="table-row">
                  <Typography.Body1
                    className="table-cell min-w-0 break-words pb-2.5 font-semibold [&+.date]:text-right"
                  >
                    {item.source || t('incomes.details.unknownSource')}
                  </Typography.Body1>
                  <Typography.Body2 className="date table-cell pb-2.5 text-right text-muted-foreground">
                    {format(item.transactionDate, 'LLL d, y', { locale: ru })}
                  </Typography.Body2>
                  <Typography.Body1 className="table-cell w-25 break-words pb-2.5 text-right">
                    {formatAmount.format(item.amount)}
                  </Typography.Body1>
                </div>
              ))}
            </div>
            <Typography.Body1>{t('incomes.history.total')}</Typography.Body1>
            <Typography.SpecialBody1 className="break-all">{formatAmount.format(total)}</Typography.SpecialBody1>
          </>
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
