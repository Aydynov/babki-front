import { paginateHistory } from '@/shared/lib/paginated-history';
import { Button } from '@/shared/ui/button';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { LucideChevronLeft, LucideChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface HistoryTableProps<T extends { _id: string }> {
  title: string;
  hideTitle?: boolean;
  action?: ReactNode;
  items: T[];
  loading: boolean;
  error: boolean;
  empty: string;
  onRetry: () => void;
  headers: string[];
  renderRow: (item: T) => ReactNode;
  labels: {
    loading: string;
    error: string;
    pagination: string;
    previous: string;
    next: string;
    page: (page: number, pages: number, total: number) => string;
  };
}

export function HistoryTable<T extends { _id: string }>({
  title, hideTitle = false, action, items, loading, error, empty, onRetry, headers, renderRow, labels,
}: HistoryTableProps<T>) {
  const [requestedPage, setPage] = useState(1);
  const {
    items: visibleItems, page, pages, total,
  } = paginateHistory(items, requestedPage);
  // Keep the stored page in range after a deletion so subsequent refreshes cannot restore a removed page.
  if (!loading && !error && page !== requestedPage) setPage(page);

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label={title}>
      {(!hideTitle || action) && (
        <div className="flex items-center gap-2">
          {!hideTitle && <h3 className="text-body-1 font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {loading && (
        <div
          aria-busy="true"
          aria-label={labels.loading}
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {error && (
        <QueryError
          compact
          message={labels.error}
          onRetry={onRetry}
        />
      )}
      {!loading && !error && total === 0 && <p className="text-body-2 text-muted-foreground">{empty}</p>}
      {total > 0 && (
        <>
          <table className="w-full table-fixed text-left text-body-2">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="border-b px-1 py-2 font-medium text-muted-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{visibleItems.map(renderRow)}</tbody>
          </table>
          <nav
            aria-label={labels.pagination}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            <Button.Icon
              variant="outline"
              aria-label={labels.previous}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <LucideChevronLeft />
            </Button.Icon>
            <span className="text-body-2" aria-live="polite">
              {labels.page(page, pages, total)}
            </span>
            <Button.Icon
              variant="outline"
              aria-label={labels.next}
              disabled={page === pages}
              onClick={() => setPage(page + 1)}
            >
              <LucideChevronRight />
            </Button.Icon>
          </nav>
        </>
      )}
    </section>
  );
}
