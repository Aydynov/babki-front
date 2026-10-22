import { getReportCurrencySections, useReportsQueryOptions } from '@/entities/reports';
import { usePeriodStore } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export function LastYearRest() {
  const reportsQueryOptions = useReportsQueryOptions();
  const { t, i18n } = useTranslation();
  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const currentYear = usePeriodStore((state) => state.selectedYear);
  const loading = reportsQuery.isLoading;
  const available = reportsQuery.data !== undefined;
  const prevYearReport = reportsQuery.data?.find((report) => Number(report.period) === currentYear - 1);
  const sections = available ? getReportCurrencySections(
    reportsQuery.data,
    currentYear - 1,
  ) : [];

  return (
    <Card.Base className="min-h-28 w-full min-w-0 gap-3 p-3.5">
      <Typography.Title3 className="text-muted-foreground uppercase">
        {t('fromLastYear.title')}
      </Typography.Title3>
      {loading && (
        <div
          aria-busy="true"
          aria-label={t('queryState.loading')}
          className="flex flex-col gap-2.5"
        >
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      )}
      {(reportsQuery.isError) && (
        <QueryError
          compact={available}
          onRetry={() => {
            reportsQuery.refetch().catch(() => undefined);
          }}
        />
      )}
      {!loading && available && !prevYearReport && (
        <Typography.Body2 className="text-muted-foreground">{t('queryState.empty')}</Typography.Body2>
      )}
      {!loading && available && prevYearReport && (
        <div className="flex flex-col divide-y">
          {sections.map((section) => (
            <div key={section.currency} className="flex min-w-0 flex-col gap-2 py-2">
              <Typography.Body2 className="font-semibold">{section.currency}</Typography.Body2>
              {[
                { title: t('fromLastYear.rest'), value: section.balance },
                { title: t('fromLastYear.savings'), value: section.saving },
              ].map(({ title, value }) => (
                <div key={title} className="flex min-w-0 flex-wrap justify-between gap-2">
                  <Typography.Body2 className="text-muted-foreground">{title}</Typography.Body2>
                  <Typography.Body1 className="ml-auto min-w-0 break-all text-right font-semibold tabular-nums">
                    {formatMoney(value, section.currency, i18n.language)}
                  </Typography.Body1>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card.Base>
  );
}
