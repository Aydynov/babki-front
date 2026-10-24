import { useBudgetScope } from '@/entities/budgets';
import { debtsQueryOptions, useDebtsQueryOptions, type Debt } from '@/entities/debts';
import { CreateDebtButton } from '@/features/create-debt';
import { DebtDetailsDialog } from '@/features/manage-debt';
import { currencyCodes, formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Card } from '@/shared/ui/card';
import {
  CollectionFilters, CollectionList, CollectionPagination,
} from '@/shared/ui/collection';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LucideMaximize2 } from 'lucide-react';
import {
  useEffect, useId, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';

function DebtsList({ expanded = false }: { expanded?: boolean }) {
  const archiveId = useId();
  const selectedTrigger = useRef<HTMLElement | null>(null);
  const fallbackFocus = useRef<HTMLDivElement | null>(null);
  const scope = useBudgetScope();
  const { i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('active');
  const [currency, setCurrency] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [debtOpenError, setDebtOpenError] = useState(false);
  const client = useQueryClient();
  const limit = expanded ? 20 : 10;
  const debtsQuery = useQuery(useDebtsQueryOptions().findAll({
    status: status === 'active' || status === 'closed' ? status : undefined,
    currency: currency || undefined,
    includeArchived,
    page,
    limit,
  }));
  const pages = Math.max(1, Math.ceil((debtsQuery.data?.total ?? 0) / limit));
  if (debtsQuery.isSuccess && page > pages) setPage(pages);
  const formatDate = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (expanded) return undefined;
    let active = true;
    const openDebt = (event: Event) => {
      const id: unknown = (event as CustomEvent<unknown>).detail;
      if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return;
      setDebtOpenError(false);
      client.fetchQuery(debtsQueryOptions.findOne(id, scope)).then((debt) => {
        if (active) setSelectedDebt(debt);
      }).catch(() => {
        if (active) setDebtOpenError(true);
      });
    };
    window.addEventListener('babki:open-debt', openDebt);
    return () => {
      active = false;
      window.removeEventListener('babki:open-debt', openDebt);
    };
  }, [client, expanded, scope]);

  return (
    <div
      ref={fallbackFocus}
      tabIndex={-1}
      className="outline-none"
    >
      {expanded && (
        <CollectionFilters filters={[
          {
            label: 'Статус',
            value: status,
            options: [
              { value: '', label: 'Все статусы' },
              { value: 'active', label: 'Активные' },
              { value: 'closed', label: 'Закрытые' },
            ],
            onChange: (value) => {
              setStatus(value);
              setPage(1);
            },
          },
          {
            label: 'Валюта',
            value: currency,
            options: [
              { value: '', label: 'Все валюты' },
              ...currencyCodes.map((code) => ({ value: code, label: code })),
            ],
            onChange: (value) => {
              setCurrency(value);
              setPage(1);
            },
          },
        ]}
        >
          <label
            htmlFor={archiveId}
            className="flex min-h-8 cursor-pointer items-center gap-2 px-2 text-body-2 text-muted-foreground"
          >
            <input
              id={archiveId}
              type="checkbox"
              className="size-4 accent-primary"
              checked={includeArchived}
              onChange={(event) => {
                setIncludeArchived(event.target.checked);
                setPage(1);
              }}
            />
            С архивными
          </label>
        </CollectionFilters>
      )}
      <div className={expanded ? '-mx-4 sm:-mx-5' : undefined}>
        <CollectionList
          compact={!expanded}
          rows={(debtsQuery.data?.items ?? []).map((debt) => ({
            id: debt._id,
            title: debt.debtor,
            date: debt.dueDate ? formatDate.format(new Date(debt.dueDate)) : 'Без срока',
            amount: formatMoney(debt.remainingAmount, debt.currency, i18n.language),
            struckThrough: expanded && debt.status === 'closed',
            statusLabel: expanded && debt.status === 'closed' ? 'Закрыт' : undefined,
            badge: expanded && debt.archivedAt && debt.status !== 'closed' ? 'В архиве' : undefined,
          }))}
          loading={debtsQuery.isLoading}
          error={debtsQuery.isError}
          empty={expanded ? 'Долги не найдены. Попробуйте изменить фильтры.' : 'Нет активных долгов'}
          onRetry={() => {
            debtsQuery.refetch().catch(() => undefined);
          }}
          onSelect={(id, trigger) => {
            selectedTrigger.current = trigger;
            setSelectedDebt(debtsQuery.data?.items.find((debt) => debt._id === id) ?? null);
          }}
        />
      </div>
      {expanded && (
        <CollectionPagination
          page={page}
          total={debtsQuery.data?.total}
          limit={limit}
          pending={debtsQuery.isFetching}
          onPageChange={setPage}
        />
      )}
      {debtOpenError && (
        <p role="alert" className="px-5 py-2 text-destructive">Связанный долг недоступен в этом бюджете.</p>
      )}
      {selectedDebt && (
        <DebtDetailsDialog
          key={selectedDebt._id}
          debt={selectedDebt}
          finalFocus={selectedTrigger}
          fallbackFocus={fallbackFocus}
          onClose={() => setSelectedDebt(null)}
        />
      )}
    </div>
  );
}

export function Debts() {
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef<HTMLButtonElement | null>(null);

  return (
    <Card.Base className="min-h-64">
      <Card.Header>
        <Card.Title>Нам должны</Card.Title>
        <Card.Controls>
          <Button.Icon
            ref={expandButton}
            aria-label="Все долги"
            title="Все долги"
            aria-haspopup="dialog"
            onClick={() => setExpanded(true)}
          >
            <LucideMaximize2 />
          </Button.Icon>
          <CreateDebtButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0"><DebtsList /></Card.Content>
      {expanded && (
        <ScrollDialog.Base open onOpenChange={(open) => !open && setExpanded(false)}>
          <ScrollDialog.Content className="max-w-3xl" finalFocus={expandButton}>
            <ScrollDialog.Layout
              title="Все долги"
              closeLabel="Закрыть окно"
              onClose={() => setExpanded(false)}
            >
              <DebtsList expanded />
            </ScrollDialog.Layout>
          </ScrollDialog.Content>
        </ScrollDialog.Base>
      )}
    </Card.Base>
  );
}
