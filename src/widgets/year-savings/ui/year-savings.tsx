import { getReportMetricSections, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { usePeriodStore } from '@/features/select-period';
import { getPercent } from '@/shared/lib/getPercent';
import { CardAmount, CardAmountSkeleton } from '@/shared/ui/card-amount';
import { QueryError } from '@/shared/ui/query-error';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const YearSavings: FC = () => {
  const selectedYear = usePeriodStore((state) => state.selectedYear);
  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const userQuery = useQuery(usersQueryOptions.me());
  const { t } = useTranslation();

  if (reportsQuery.isLoading || userQuery.isLoading) {
    return (
      <CardAmountSkeleton title={t('savings.title')} withDiff />
    );
  }

  if ((reportsQuery.isError && reportsQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined)) {
    return (
      <QueryError onRetry={() => {
        reportsQuery.refetch().catch(() => undefined);
        userQuery.refetch().catch(() => undefined);
      }}
      />
    );
  }

  const sections = getReportMetricSections(
    reportsQuery.data,
    selectedYear,
    selectedYear - 1,
    'saving',
    userQuery.data!.defaultCurrency,
  );

  return (
    <div className="flex flex-col gap-2.5">
      {(reportsQuery.isError || userQuery.isError) && (
      <QueryError
        compact
        onRetry={() => {
          reportsQuery.refetch().catch(() => undefined);
          userQuery.refetch().catch(() => undefined);
        }}
      />
      )}
      {sections.map(({ currency, value, previousValue }) => (
        <CardAmount
          key={currency}
          currency={currency}
          title={`${t('savings.title')} · ${currency}`}
          value={value}
          valueNotation="standard"
          diff={getPercent(value, previousValue)}
        />
      ))}
    </div>
  );
};
