import { getReportMetricSections, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { usePeriodStore } from '@/features/select-period';
import { getPercent } from '@/shared/lib/getPercent';
import { CurrencySummary } from '@/shared/ui/currency-summary';
import { QueryError } from '@/shared/ui/query-error';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export function YearExpenses() {
  const selectedYear = usePeriodStore((state) => state.selectedYear);
  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const userQuery = useQuery(usersQueryOptions.me());
  const { t } = useTranslation();
  const loading = reportsQuery.isLoading || userQuery.isLoading;
  const user = userQuery.data;
  const available = reportsQuery.data !== undefined && user != null;
  const sections = available ? getReportMetricSections(
    reportsQuery.data,
    selectedYear,
    selectedYear - 1,
    'expenses',
    user.defaultCurrency,
  ) : [];

  return (
    <CurrencySummary
      title={t('expenses.title')}
      loading={loading}
      decreaseIsPositive
      rows={sections.map(({ currency, value, previousValue }) => ({
        currency, value, diff: getPercent(value, previousValue),
      }))}
      feedback={(reportsQuery.isError || userQuery.isError) && (
        <QueryError
          compact={available}
          onRetry={() => {
            reportsQuery.refetch().catch(() => undefined);
            userQuery.refetch().catch(() => undefined);
          }}
        />
      )}
    />
  );
}
