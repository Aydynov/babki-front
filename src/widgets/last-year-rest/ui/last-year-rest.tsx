import { getReportCurrencySections, reportsQueryOptions } from '@/entities/reports';
import { usersQueryOptions } from '@/entities/users';
import { usePeriodStore } from '@/features/select-period';
import { Card } from '@/shared/ui/card';
import { CardList } from '@/shared/ui/card-list';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const LastYearRest: FC = () => {
  const { t } = useTranslation();
  const reportsQuery = useQuery(reportsQueryOptions.yearly());
  const userQuery = useQuery(usersQueryOptions.me());
  const currentYear = usePeriodStore((state) => state.selectedYear);
  const prevYearReport = reportsQuery.data?.find((report) => (
    Number(report.period) === currentYear - 1));
  const sections = getReportCurrencySections(
    reportsQuery.data,
    currentYear - 1,
    userQuery.data?.defaultCurrency ?? 'RUB',
  );

  if (reportsQuery.isLoading || userQuery.isLoading) {
    return (
      <Card.Base
        aria-busy="true"
        className="min-h-28 w-full min-w-0 max-w-xl gap-6 p-3.5 lg:w-2xs"
      >
        <span className="sr-only">{t('queryState.loading')}</span>
        <Typography.Title3 className="text-muted-foreground uppercase">
          {t('fromLastYear.title')}
        </Typography.Title3>
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between gap-2.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between gap-2.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </Card.Base>
    );
  }

  if ((reportsQuery.isError && reportsQuery.data === undefined)
    || (userQuery.isError && userQuery.data === undefined)) {
    return (
      <Card.Base className="min-h-28 w-full min-w-0 max-w-xl gap-6 p-3.5 lg:w-2xs">
        <QueryError onRetry={() => {
          reportsQuery.refetch().catch(() => undefined);
          userQuery.refetch().catch(() => undefined);
        }}
        />
      </Card.Base>
    );
  }

  if (!prevYearReport) {
    return (
      <Card.Base className="min-h-28 w-full min-w-0 max-w-xl gap-6 p-3.5 lg:w-2xs">
        <Typography.Title3 className="text-muted-foreground uppercase">
          {t('fromLastYear.title')}
        </Typography.Title3>
        <Typography.Body2 className="text-muted-foreground">
          {t('queryState.empty')}
        </Typography.Body2>
      </Card.Base>
    );
  }

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
      {sections.map((section) => (
        <CardList
          key={section.currency}
          className="min-h-28"
          title={`${t('fromLastYear.title')} · ${section.currency}`}
          items={[
            {
              title: t('fromLastYear.rest'),
              value: section.balance,
              currency: section.currency,
            },
            {
              title: t('fromLastYear.savings'),
              value: section.saving,
              currency: section.currency,
            },
          ]}
        />
      ))}
    </div>
  );
};
