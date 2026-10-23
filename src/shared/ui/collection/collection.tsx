import type { ReactNode, RefObject } from 'react';
import {
  LucideChevronLeft, LucideChevronRight, LucideListFilter, LucideX,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { QueryError } from '@/shared/ui/query-error';
import { Select } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table } from '@/shared/ui/table';
import { cn } from '@/shared/lib/shadcn-utils';

export function CollectionDialog({
  title, finalFocus, onClose, children,
}: {
  title: string;
  finalFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Base open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col overflow-hidden"
        finalFocus={finalFocus}
      >
        <Dialog.Header className="shrink-0 pb-5">
          <Dialog.Title>{title}</Dialog.Title>
          <Button.Icon aria-label="Закрыть" onClick={onClose}><LucideX /></Button.Icon>
        </Dialog.Header>
        {children}
      </Dialog.Content>
    </Dialog.Base>
  );
}

export function CollectionFilters({ filters, children, className }: {
  filters: {
    label: string;
    disabled?: boolean;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 flex-wrap items-center gap-2 border-y bg-muted/30 px-1 py-3', className)}>
      <LucideListFilter className="mx-1 hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
      {filters.map((filter) => (
        <Select.Root
          key={filter.label}
          disabled={filter.disabled}
          items={filter.options}
          value={filter.value}
          onValueChange={(value) => {
            if (value !== null) filter.onChange(value);
          }}
        >
          <Select.Trigger aria-label={filter.label} className="min-w-32 flex-1 bg-background sm:flex-none">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {filter.options.map((option) => (
              <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      ))}
      {children}
    </div>
  );
}

interface CollectionRow {
  id: string;
  title: string;
  date: string;
  amount: string;
  badge?: string;
  struckThrough?: boolean;
  statusLabel?: string;
}

export function CollectionList({
  rows, loading, error, empty, onRetry, onSelect, compact = false,
}: {
  rows: CollectionRow[];
  loading: boolean;
  error: boolean;
  empty: string;
  onRetry: () => void;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div aria-busy={loading} className="@container min-h-36">
      {loading && (
        <div className="space-y-5 px-5 py-4" aria-label="Загрузка...">
          {[1, 2, 3].map((row) => <Skeleton key={row} className="h-9 w-full" />)}
        </div>
      )}
      {error && <div className="p-5"><QueryError compact={rows.length > 0} onRetry={onRetry} /></div>}
      {!loading && !error && rows.length === 0 && (
        <div className="flex min-h-36 items-center justify-center px-5 py-8 text-center text-muted-foreground">
          {empty}
        </div>
      )}
      {!loading && rows.length > 0 && (
        <Table.Base>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row
                key={row.id}
                role="button"
                tabIndex={0}
                className={`
                  cursor-pointer outline-none focus-visible:bg-muted
                  focus-visible:ring-2 focus-visible:ring-inset
                `}
                onClick={() => onSelect(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(row.id);
                  }
                }}
              >
                <div
                  className={cn(
                    'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3',
                    !compact && '@xl:grid-cols-[minmax(0,1fr)_10rem_9rem] @xl:items-center',
                    row.struckThrough && 'line-through',
                  )}
                >
                  <Table.Cell
                    className={cn('col-start-1 row-start-1 min-w-0 break-words pt-4 pr-0 pb-1', !compact && '@xl:py-4')}
                  >
                    {row.title}
                    {row.statusLabel && <span className="sr-only">{` · ${row.statusLabel}`}</span>}
                    {row.badge && (
                      <span className="mt-1 block w-fit rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {row.badge}
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell
                    className={cn(
                      'col-start-1 row-start-2 pt-0 pb-4 text-body-2 text-muted-foreground',
                      !compact && '@xl:col-start-2 @xl:row-start-1 @xl:py-4',
                    )}
                  >
                    {row.date}
                  </Table.Cell>
                  <Table.Cell
                    className={cn(
                      'col-start-2 row-start-1 pt-4 pb-1 text-right tabular-nums',
                      !compact && '@xl:col-start-3 @xl:py-4',
                    )}
                  >
                    {row.amount}
                  </Table.Cell>
                </div>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Base>
      )}
    </div>
  );
}

export function CollectionPagination({
  page, total, limit, pending, onPageChange, className,
}: {
  page: number;
  total: number | undefined;
  limit: number;
  pending: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil((total ?? 0) / limit));
  return (
    <nav
      aria-label="Страницы списка"
      className={cn('flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4', className)}
    >
      <span className="text-body-2 text-muted-foreground" aria-live="polite">
        {total !== undefined && `Всего записей: ${total}`}
        {total === undefined && (pending ? 'Загрузка…' : 'Список недоступен')}
      </span>
      <div className="flex items-center gap-2">
        <Button.Icon
          variant="outline"
          aria-label="Предыдущая страница"
          disabled={page <= 1 || pending}
          onClick={() => onPageChange(page - 1)}
        >
          <LucideChevronLeft />
        </Button.Icon>
        <span className="min-w-16 text-center text-body-2 tabular-nums" aria-live="polite">
          {page}
          {' / '}
          {pages}
        </span>
        <Button.Icon
          variant="outline"
          aria-label="Следующая страница"
          disabled={total === undefined || page >= pages || pending}
          onClick={() => onPageChange(page + 1)}
        >
          <LucideChevronRight />
        </Button.Icon>
      </div>
    </nav>
  );
}
