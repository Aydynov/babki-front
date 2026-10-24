import { usePlansQueryOptions, type Plan } from '@/entities/plans';
import { CreatePlanButton } from '@/features/create-plan';
import { PlanDetailsDialog } from '@/features/manage-plan';
import { currencyCodes, formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  CollectionDialog, CollectionFilters, CollectionList, CollectionPagination,
} from '@/shared/ui/collection';
import { useQuery } from '@tanstack/react-query';
import { LucideMaximize2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function PlansList({ expanded = false }: { expanded?: boolean }) {
  const archiveId = useId();
  const planTrigger = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('active');
  const [currency, setCurrency] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const limit = expanded ? 20 : 10;
  const plansQuery = useQuery(usePlansQueryOptions().findAll({
    status: status === 'active' || status === 'closed' ? status : undefined,
    currency: currency || undefined,
    includeArchived,
    page,
    limit,
  }));
  const pages = Math.max(1, Math.ceil((plansQuery.data?.total ?? 0) / limit));
  if (plansQuery.isSuccess && page > pages) setPage(pages);
  const formatDate = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
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
      <div
        ref={listRef}
        tabIndex={-1}
        aria-label="Список планов"
        className={expanded ? '-mx-4 min-h-0 flex-1 overflow-y-auto sm:-mx-5' : undefined}
      >
        <CollectionList
          compact={!expanded}
          rows={(plansQuery.data?.items ?? []).map((plan) => ({
            id: plan._id,
            title: plan.description,
            date: formatDate.format(new Date(plan.targetDate)),
            amount: formatMoney(plan.amount, plan.currency, i18n.language),
            struckThrough: expanded && plan.status === 'closed',
            statusLabel: expanded && plan.status === 'closed' ? 'Закрыт' : undefined,
            badge: expanded && plan.archivedAt && plan.status !== 'closed' ? 'В архиве' : undefined,
          }))}
          loading={plansQuery.isLoading}
          error={plansQuery.isError}
          empty={expanded ? 'Планы не найдены. Попробуйте изменить фильтры.' : 'Нет активных планов'}
          onRetry={() => {
            plansQuery.refetch().catch(() => undefined);
          }}
          onSelect={(id, trigger) => {
            planTrigger.current = trigger;
            setSelectedPlan(plansQuery.data?.items.find((plan) => plan._id === id) ?? null);
          }}
        />
      </div>
      {expanded && (
        <CollectionPagination
          page={page}
          total={plansQuery.data?.total}
          limit={limit}
          pending={plansQuery.isFetching}
          onPageChange={setPage}
        />
      )}
      {selectedPlan && (
        <PlanDetailsDialog
          key={selectedPlan._id}
          plan={selectedPlan}
          finalFocus={planTrigger}
          fallbackFocus={listRef}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}

export function Plans() {
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef<HTMLButtonElement | null>(null);

  return (
    <Card.Base className="min-h-64">
      <Card.Header>
        <Card.Title>Планирование</Card.Title>
        <Card.Controls>
          <Button.Icon
            ref={expandButton}
            aria-label="Все планы"
            title="Все планы"
            aria-haspopup="dialog"
            onClick={() => setExpanded(true)}
          >
            <LucideMaximize2 />
          </Button.Icon>
          <CreatePlanButton />
        </Card.Controls>
      </Card.Header>
      <Card.Content className="px-0"><PlansList /></Card.Content>
      {expanded && (
        <CollectionDialog
          title="Все планы"
          finalFocus={expandButton}
          onClose={() => setExpanded(false)}
        >
          <PlansList expanded />
        </CollectionDialog>
      )}
    </Card.Base>
  );
}
