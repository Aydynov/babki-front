import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { LucideArrowDown, LucideArrowUp } from 'lucide-react';
import { formatMoney, type CurrencyCode } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';

interface CurrencySummaryProps {
  title: string;
  rows: { currency: CurrencyCode; value: number; diff: number }[];
  loading?: boolean;
  feedback?: ReactNode;
  decreaseIsPositive?: boolean;
}

export function CurrencySummary({
  title, rows, loading = false, feedback, decreaseIsPositive = false,
}: CurrencySummaryProps) {
  const { t, i18n } = useTranslation();
  const formatDiff = new Intl.NumberFormat(i18n.language, {
    style: 'percent', signDisplay: 'exceptZero', notation: 'compact',
  });

  return (
    <Card.Base className="min-h-28 w-full min-w-0 gap-3 p-3.5">
      <Typography.Title3 className="text-muted-foreground uppercase">{title}</Typography.Title3>
      {loading && (
        <div
          aria-busy="true"
          aria-label={t('queryState.loading')}
          className="flex flex-col gap-2.5"
        >
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
      {feedback}
      {!loading && rows.length > 0 && (
        <div className="flex flex-col divide-y">
            {rows.map(({ currency, value, diff }) => {
              const DiffIcon = diff > 0 ? LucideArrowUp : LucideArrowDown;
              const positive = decreaseIsPositive ? diff < 0 : diff > 0;
              return (
                <div key={currency} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography.Body2>{currency}</Typography.Body2>
                    {!!diff && (
                      <Typography.Body2
                        className={clsx('flex items-center', positive ? 'text-success' : 'text-destructive')}
                      >
                        {formatDiff.format(diff)}
                        <DiffIcon
                          aria-hidden="true"
                          className="ml-1 size-4"
                          strokeWidth={1.75}
                        />
                      </Typography.Body2>
                    )}
                  </div>
                  <Typography.Body1 className="min-w-0 break-all text-right font-semibold tabular-nums ml-auto">
                    {formatMoney(value, currency, i18n.language)}
                  </Typography.Body1>
                </div>
              );
            })}
        </div>
      )}
    </Card.Base>
  );
}
