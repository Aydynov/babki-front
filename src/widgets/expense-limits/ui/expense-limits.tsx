import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useBudgetPermission, useBudgetScope } from '@/entities/budgets';
import {
  getExpenseLimitProgress, getExpenseLimitsForCurrency, useExpenseLimitsQueryOptions,
} from '@/entities/expense-limits';
import { useSelectedPeriod } from '@/features/select-period';
import { ChartCurrencySelect, useChartCurrency } from '@/features/select-chart-currency';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Card } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { getExpenseLimitCurrencies } from '../model/currency-options';
import { ExpenseLimitDialog } from './expense-limit-dialog';

function ExpenseLimitsContent() {
  const { t } = useTranslation();
  const allowed = useBudgetPermission('manageLimits');
  const period = useSelectedPeriod();
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const limits = useQuery(useExpenseLimitsQueryOptions().findAll({ periodDate: period.toDate }));
  const currencies = useMemo(() => {
    if (!accounts.data) return undefined;
    return getExpenseLimitCurrencies(accounts.data);
  }, [accounts.data]);
  const [currency, setCurrency] = useChartCurrency(currencies);
  const rows = getExpenseLimitsForCurrency(limits.data, currency);
  const [selection, setSelection] = useState<{ id?: string; month: string; currency: string }>();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const gear = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const month = period.fromDate.slice(0, 7);
  const loading = accounts.isLoading || limits.isLoading;
  const unavailable = accounts.data === undefined || limits.data === undefined;
  const retry = () => {
    accounts.refetch().catch(() => undefined);
    limits.refetch().catch(() => undefined);
  };
  const closeUnavailable = () => {
    trigger.current = gear.current;
    setSelection(undefined);
    requestAnimationFrame(() => {
      if (gear.current && !gear.current.disabled) gear.current.focus();
      else cardRef.current?.focus();
    });
  };
  const selectedContext = selection?.month === month && selection?.currency === currency;
  useEffect(() => {
    if (selection && !selectedContext) closeUnavailable();
  }, [selection, selectedContext]);
  return (
    <Card.Base
      ref={cardRef}
      tabIndex={-1}
      aria-busy={loading || undefined}
      className="h-fit min-h-56 w-full min-w-0 md:w-auto md:min-w-93"
    >
      <Card.Header>
        <Card.Title>По лимитам</Card.Title>
        <Card.Controls>
          {currencies && (
          <ChartCurrencySelect
            chartTitle="По лимитам"
            currencies={currencies}
            ariaLabel="Валюта лимитов за месяц"
            value={currency}
            onChange={setCurrency}
          />
          )}
          {allowed && (
            <Button.Icon
              ref={gear}
              disabled={!currency}
              aria-label={t('expenseLimits.management.open')}
              onClick={(event) => {
                if (!currency) return;
                trigger.current = event.currentTarget;
                setSelection({ month, currency });
              }}
            >
              <Icon icon="IcGear20" />
            </Button.Icon>
          )}
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0">
        {(accounts.isError || limits.isError) && <QueryError compact={!unavailable} onRetry={retry} />}
        {loading && (
          <div className="flex flex-col gap-3 px-5" aria-busy="true">
            <span className="sr-only">Загрузка...</span>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}
        {!loading && !unavailable && !rows.length && (
          <Typography.Body1 className="px-5 py-8 text-center text-muted-foreground">
            {t(currency ? 'expenseLimits.management.empty' : 'expenseLimits.noAccounts')}
          </Typography.Body1>
        )}
        {!loading && !unavailable && rows.map((limit) => (
          <button
            key={limit._id}
            type="button"
            className="
              block w-full cursor-pointer rounded-lg px-5 pb-5 text-left outline-none
              focus-visible:ring-2 focus-visible:ring-ring
            "
            onClick={(event) => {
              if (!currency) return;
              trigger.current = event.currentTarget;
              setSelection({ id: limit._id, month, currency });
            }}
          >
            <Progress.Root value={getExpenseLimitProgress(limit)} variant={limit.rest > 0 ? 'success' : 'danger'}>
              <Progress.Label>{limit.category.name}</Progress.Label>
              <Progress.Value>{() => formatMoney(limit.rest, limit.currency)}</Progress.Value>
            </Progress.Root>
          </button>
        ))}
      </Card.Content>
      {selection && selectedContext && currency && (
        <ExpenseLimitDialog
          key={`${month}:${currency}:${selection.id ?? 'manage'}`}
          limits={limits.data}
          periodDate={period.toDate}
          currency={currency}
          limitId={selection.id}
          finalFocus={trigger}
          onClose={() => setSelection(undefined)}
          onUnavailable={closeUnavailable}
        />
      )}
    </Card.Base>
  );
}

export function ExpenseLimits() {
  const scope = useBudgetScope();
  return <ExpenseLimitsContent key={`${scope.userId}:${scope.spaceId}`} />;
}
