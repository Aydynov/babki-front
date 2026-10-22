import { getReportMetricSections, useReportsQueryOptions } from '@/entities/reports';
import { usePeriodStore } from '@/features/select-period';
import { getPercent } from '@/shared/lib/getPercent';
import { CurrencySummary } from '@/shared/ui/currency-summary';
import { QueryError } from '@/shared/ui/query-error';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export function YearExpenses() {
  const reportsQueryOptions = useReportsQueryOptions();
  const selectedYear = usePeriodStore((state) => state.selectedYear);
  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const { t } = useTranslation();
  const loading = reportsQuery.isLoading;
  const available = reportsQuery.data !== undefined;
  const sections = available ? getReportMetricSections(
    reportsQuery.data,
    selectedYear,
    selectedYear - 1,
    'expenses',
  ) : [];

  return (
    <CurrencySummary
      title={t('expenses.title')}
      loading={loading}
      decreaseIsPositive
      rows={sections.map(({ currency, value, previousValue }) => ({
        currency, value, diff: getPercent(value, previousValue),
      }))}
      feedback={(reportsQuery.isError) && (
        <QueryError
          compact={available}
          onRetry={() => {
            reportsQuery.refetch().catch(() => undefined);
          }}
        />
      )}
    />
  );
}
