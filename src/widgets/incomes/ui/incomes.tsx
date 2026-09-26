import { incomesQueryOptions } from '@/entities/incomes';
import { usersQueryOptions } from '@/entities/users';
import { useSelectedPeriod } from '@/features/select-period';
import { CreateIncomeButton } from '@/features/create-income';
import { sortCurrencyCodes } from '@/shared/lib/currency';
import { CardAmount, CardAmountSkeleton } from '@/shared/ui/card-amount';
import { QueryError } from '@/shared/ui/query-error';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const Incomes: FC = () => {
  const selectedPeriod = useSelectedPeriod();
  const totalRevenueQuery = useQuery(
    incomesQueryOptions.findTotalRevenue(selectedPeriod),
  );
  const incomesQuery = useQuery(
    incomesQueryOptions.findAll(selectedPeriod),
  );
  const userQuery = useQuery(usersQueryOptions.me());
  const { t } = useTranslation();
  const defaultCurrency = userQuery.data?.defaultCurrency ?? 'RUB';
  const currencies = sortCurrencyCodes(
    totalRevenueQuery.data?.currencies.map(({ currency }) => currency) ?? [],
    defaultCurrency,
  );
  if (currencies.length === 0) currencies.push(defaultCurrency);

  if (totalRevenueQuery.isLoading || incomesQuery.isLoading || userQuery.isLoading) {
    return (
      <CardAmountSkeleton title={t('incomes.title')} controls={<CreateIncomeButton />} />
    );
  }

  const hasUnavailableData = (totalRevenueQuery.isError && totalRevenueQuery.data === undefined)
    || (incomesQuery.isError && incomesQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined);
  const retry = () => {
    totalRevenueQuery.refetch().catch(() => undefined);
    incomesQuery.refetch().catch(() => undefined);
    userQuery.refetch().catch(() => undefined);
  };

  if (hasUnavailableData) return <QueryError onRetry={retry} />;

  return (
    <div className="flex flex-col gap-2.5">
      {(totalRevenueQuery.isError || incomesQuery.isError || userQuery.isError) && (
        <QueryError compact onRetry={retry} />
      )}
      {currencies.map((currency, index) => {
        const revenue = totalRevenueQuery.data?.currencies.find((item) => item.currency === currency);
        return (
          <CardAmount
            key={currency}
            currency={currency}
            title={`${t('incomes.title')} · ${currency}`}
            value={revenue?.totalRevenue ?? 0}
            valueNotation="standard"
            controls={index === 0 ? <CreateIncomeButton /> : undefined}
            items={incomesQuery.data?.items
              .filter((income) => income.currency === currency)
              .map(({ transactionDate, source, amount }) => ({
                title: source,
                date: format(transactionDate, 'LLL d, y', { locale: ru }),
                value: amount,
              }))}
          />
        );
      })}
    </div>
  );
};
