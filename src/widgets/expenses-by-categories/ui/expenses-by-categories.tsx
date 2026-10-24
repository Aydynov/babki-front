import { useBudgetScope } from '@/entities/budgets';
import { useExpenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { getMonthlyExpenseCategoryBuckets, useReportsQueryOptions } from '@/entities/reports';
import { CategoryDialog, CreateCategoryButton } from '@/features/manage-expense-categories';
import { ChartCurrencySelect, useChartCurrency } from '@/features/select-chart-currency';
import { useSelectedPeriod } from '@/features/select-period';
import { formatMoney } from '@/shared/lib/currency';
import { getPercent } from '@/shared/lib/getPercent';
import { Button } from '@/shared/ui/button';
import { LucideArchive, LucideArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Body1 } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import {
  useMemo, useState, useRef, useEffect,
  type FC,
} from 'react';
import { getSortedMonthlyExpenseCategoryRows } from '../model/sort-monthly-expense-category-rows';

const CategoryWidget: FC = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'active' | 'archived'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailsTrigger = useRef<HTMLButtonElement | null>(null);
  const modeTrigger = useRef<HTMLButtonElement | null>(null);
  const expenseCategoriesQueryOptions = useExpenseCategoriesQueryOptions();
  const reportsQueryOptions = useReportsQueryOptions();
  const selectedPeriod = useSelectedPeriod();
  const selectedYear = selectedPeriod.fromDate.slice(0, 4);
  const reportPeriod = selectedPeriod.fromDate.slice(0, 7);
  const reportQuery = useMemo(() => ({
    fromDate: `${selectedYear}-01-01`,
    toDate: Number(selectedYear) === new Date().getFullYear()
      ? selectedPeriod.toDate
      : `${selectedYear}-12-31`,
  }), [selectedPeriod.toDate, selectedYear]);
  const reportsQuery = useQuery(reportsQueryOptions.monthly(reportQuery));
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesQuery.data;
  const currencyBuckets = useMemo(() => getMonthlyExpenseCategoryBuckets(
    reportsQuery.data,
    reportPeriod,
  ), [reportsQuery.data, reportPeriod]);
  const currencies = useMemo(() => (reportsQuery.data
    ? currencyBuckets.map(({ currency }) => currency)
    : undefined), [reportsQuery.data, currencyBuckets]);
  const [currency, setCurrency] = useChartCurrency(
    reportsQuery.data ? currencies : undefined,
  );
  const selectedBucket = currencyBuckets.find((bucket) => bucket.currency === currency);
  const categoryRows = useMemo(() => getSortedMonthlyExpenseCategoryRows(
    categories,
    selectedBucket,
    mode,
  ), [categories, selectedBucket, mode]);
  const selectedCategory = categories?.find((category) => category._id === selectedId);
  const selectedTotal = selectedBucket?.expensesByCategory.find((row) => row.categoryId === selectedId)?.total ?? 0;
  const closeUnavailable = () => {
    detailsTrigger.current = modeTrigger.current;
    setSelectedId(null);
    requestAnimationFrame(() => modeTrigger.current?.focus());
  };
  useEffect(() => {
    if (selectedId && !selectedCategory && categories) closeUnavailable();
  }, [selectedId, selectedCategory, categories]);
  const isLoading = reportsQuery.isLoading || categoriesQuery.isLoading;
  const hasUnavailableData = (reportsQuery.isError && reportsQuery.data === undefined)
    || (categoriesQuery.isError && categoriesQuery.data === undefined);
  const retry = () => {
    reportsQuery.refetch().catch(() => undefined);
    categoriesQuery.refetch().catch(() => undefined);
  };
  const contentClassName = !isLoading && (!categoryRows.length || !currency)
    ? 'flex grow items-center justify-center'
    : 'px-0';

  return (
    <Card.Base
      aria-busy={isLoading || undefined}
      className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93"
    >
      {isLoading && <span className="sr-only">Загрузка...</span>}
      <Card.Header>
        <Card.Title>{mode === 'active' ? 'По категориям' : t('expenseCategories.management.archiveTitle')}</Card.Title>
        <Card.Controls>
          {!isLoading && !hasUnavailableData && currencies && (
            <ChartCurrencySelect
              chartTitle="По категориям"
              ariaLabel="Валюта расходов по категориям за месяц"
              currencies={currencies}
              value={currency}
              onChange={setCurrency}
            />
          )}
          <Button.Icon
            ref={modeTrigger}
            aria-label={t(mode === 'active'
              ? 'expenseCategories.management.archiveTitle' : 'expenseCategories.management.back')}
            onClick={() => setMode((current) => (current === 'active' ? 'archived' : 'active'))}
          >
            {mode === 'active' ? <LucideArchive /> : <LucideArrowLeft />}
          </Button.Icon>
          <CreateCategoryButton hidden={mode === 'archived'} />
        </Card.Controls>
      </Card.Header>
      <Card.Content className={contentClassName}>
        {hasUnavailableData && <QueryError onRetry={retry} />}
        {!hasUnavailableData && (reportsQuery.isError || categoriesQuery.isError) && (
          <QueryError compact onRetry={retry} />
        )}
        {isLoading && ['first', 'second', 'third'].map((row) => (
          <div key={row} className="px-5 pb-5">
            <div className="mb-2 flex justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
        {!isLoading && !hasUnavailableData && (!categoryRows.length || !currency) && (
          <Body1 className="text-muted-foreground">
            {!categoryRows.length
              ? t(mode === 'active' ? 'expenseCategories.management.activeEmpty'
                : 'expenseCategories.management.archiveEmpty')
              : 'Данные отсутствуют'}
          </Body1>
        )}
        {!isLoading && !hasUnavailableData && currency && categoryRows.map(({ category, total }) => (
          <button
            key={category._id}
            type="button"
            className="
              block w-full cursor-pointer rounded-lg px-5 pb-5 text-left outline-none
              focus-visible:ring-2 focus-visible:ring-ring
            "
            onClick={(event) => {
              detailsTrigger.current = event.currentTarget;
              setSelectedId(category._id);
            }}
          >
            <Progress.Root
              value={getPercent(
                total,
                selectedBucket?.expenses ?? 0,
                { multiplyBy100: true, useDiff: false },
              )}
              variant="danger"
            >
              <Progress.Label>{category.name}</Progress.Label>
              <Progress.Value>
                {() => formatMoney(total, currency)}
              </Progress.Value>
            </Progress.Root>
          </button>
        ))}
      </Card.Content>
      {selectedCategory && (
        <CategoryDialog
          key={selectedCategory._id}
          category={selectedCategory}
          finalFocus={detailsTrigger}
          onClose={() => setSelectedId(null)}
          onUnavailable={closeUnavailable}
        >
          <p className="text-caption-1 text-muted-foreground">
            {new Date(selectedPeriod.fromDate).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
          </p>
          <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-caption-1 text-muted-foreground">{t('expenseCategories.management.fields.color')}</dt>
              <dd className="flex items-center gap-2 text-body-2">
                <span className="size-5 rounded-full border" style={{ backgroundColor: selectedCategory.color }} />
                {selectedCategory.color ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-caption-1 text-muted-foreground">{t('expenseCategories.management.status')}</dt>
              <dd className="text-body-2">
                {t(selectedCategory.isArchived
                  ? 'expenseCategories.management.archived' : 'expenseCategories.management.active')}
              </dd>
            </div>
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-caption-1 text-muted-foreground">
                {t('expenseCategories.management.fields.description')}
              </dt>
              <dd className="whitespace-pre-wrap break-words text-body-2">
                {selectedCategory.description || t('expenseCategories.management.noDescription')}
              </dd>
            </div>
            <div>
              <dt className="text-caption-1 text-muted-foreground">{t('expenseCategories.management.total')}</dt>
              <dd className="text-body-2 tabular-nums">{currency ? formatMoney(selectedTotal, currency) : '—'}</dd>
            </div>
          </dl>
        </CategoryDialog>
      )}
    </Card.Base>
  );
};

export const ExpensesByCategories: FC = () => {
  const scope = useBudgetScope();
  return <CategoryWidget key={`${scope.userId}:${scope.spaceId}`} />;
};
