import { useBudgetScope } from '@/entities/budgets';
import { useIncomesQueryOptions } from '@/entities/incomes';
import { usersQueryOptions } from '@/entities/users';
import { useSelectedPeriod } from '@/features/select-period';
import { sortCurrencyCodes } from '@/shared/lib/currency';
import { getPercent } from '@/shared/lib/getPercent';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import {
  endOfMonth, format, parseISO, subMonths,
} from 'date-fns';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IncomeCurrencyRow } from './income-currency-row';
import { IncomeDetailsDialog } from './income-details-dialog';

export function Incomes() {
  const incomesQueryOptions = useIncomesQueryOptions();
  const scope = useBudgetScope();
  const period = useSelectedPeriod();
  const revenue = useQuery(incomesQueryOptions.findTotalRevenue(period));
  const previousMonth = subMonths(parseISO(period.fromDate), 1);
  const hasIncome = revenue.data?.currencies.some((bucket) => bucket.totalRevenue > 0) ?? false;
  const previousRevenue = useQuery({
    ...incomesQueryOptions.findTotalRevenue({
      fromDate: format(previousMonth, 'yyyy-MM-dd'),
      toDate: format(endOfMonth(previousMonth), 'yyyy-MM-dd'),
    }),
    enabled: hasIncome,
  });
  const user = useQuery(usersQueryOptions.me());
  const { t } = useTranslation();
  const [openCurrencies, setOpenCurrencies] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const detailsTrigger = useRef<HTMLButtonElement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);
  const defaultCurrency = user.data?.defaultCurrency ?? 'RUB';
  const currencies = sortCurrencyCodes(revenue.data?.currencies.map(({ currency }) => currency) ?? [], defaultCurrency);
  if (currencies.length === 0 && scope.kind === 'personal') currencies.push(defaultCurrency);
  const loading = revenue.isLoading || user.isLoading;
  const unavailable = !revenue.data || !user.data;
  const retry = () => {
    revenue.refetch().catch(() => undefined);
    user.refetch().catch(() => undefined);
  };

  return (
    <Card.Base
      ref={card}
      tabIndex={-1}
      className="flex w-full min-w-0 max-w-xl flex-col gap-3 p-3.5"
    >
      <Typography.Title3 className="text-muted-foreground uppercase">{t('incomes.title')}</Typography.Title3>
      {loading && (
        <div
          className="flex flex-col gap-2"
          aria-busy="true"
          aria-label={t('incomes.details.loading')}
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {(revenue.isError || user.isError) && <QueryError compact={!unavailable} onRetry={retry} />}
      {hasIncome && previousRevenue.isError && (
        <QueryError
          compact
          message={t('incomes.comparison.error')}
          onRetry={() => {
            previousRevenue.refetch().catch(() => undefined);
          }}
        />
      )}
      {!loading && !unavailable && currencies.length === 0 && <p>Пока нет семейных доходов.</p>}
      {!loading && !unavailable && currencies.map((currency) => (
        <IncomeCurrencyRow
          key={currency}
          currency={currency}
          total={revenue.data.currencies.find((bucket) => bucket.currency === currency)?.totalRevenue ?? 0}
          diff={getPercent(
            revenue.data.currencies.find((bucket) => bucket.currency === currency)?.totalRevenue,
            previousRevenue.data?.currencies.find((bucket) => bucket.currency === currency)?.totalRevenue,
          )}
          period={period}
          open={openCurrencies.includes(currency)}
          onOpenChange={(open) => setOpenCurrencies((current) => (
            open ? [...current, currency] : current.filter((item) => item !== currency)
          ))}
          onDetailsOpen={(trigger) => {
            detailsTrigger.current = trigger;
            setSelectedCurrency(currency);
          }}
        />
      ))}
      {selectedCurrency && (
        <IncomeDetailsDialog
          key={`${selectedCurrency}:${period.fromDate}:${period.toDate}`}
          currency={selectedCurrency}
          period={period}
          finalFocus={() => (detailsTrigger.current?.isConnected ? detailsTrigger.current : card.current)}
          onClose={() => setSelectedCurrency(null)}
        />
      )}
    </Card.Base>
  );
}
