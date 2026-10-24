import {
  useEffect, useRef, useState, type RefObject,
} from 'react';
import { Menu } from '@base-ui/react';
import { useTranslation } from 'react-i18next';
import { useBudgetPermission } from '@/entities/budgets';
import { type ExpenseLimit, useDeleteExpenseLimitMutation } from '@/entities/expense-limits';
import { DeleteExpenseLimitConfirmation, ExpenseLimitManagement } from '@/features/manage-expense-limits';
import { formatMoney, type CurrencyCode } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { ExpenseCategoryBadge } from '@/entities/expense-categories';

export function ExpenseLimitDialog({
  limits, currency, periodDate, limitId, finalFocus, onClose, onUnavailable,
}: {
  limits: ExpenseLimit[] | undefined;
  currency: CurrencyCode;
  periodDate: string;
  limitId?: string;
  finalFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const { t, i18n } = useTranslation();
  const allowed = useBudgetPermission('manageLimits');
  const [mode, setMode] = useState<'details' | 'manage'>(limitId ? 'details' : 'manage');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const remove = useDeleteExpenseLimitMutation();
  const pending = saving || remove.isPending;
  const contentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const confirmationFocus = useRef<HTMLElement | null>(null);
  const limit = limits?.find(({ _id }) => _id === limitId);
  useEffect(() => {
    if (limitId && limits && !limit) onUnavailable();
  }, [limitId, limits, limit, onUnavailable]);
  const close = () => {
    if (!pending && !deleteId) onClose();
  };
  const cancel = () => {
    if (pending || deleteId) return;
    if (limitId) {
      setMode('details');
      requestAnimationFrame(() => menuRef.current?.focus());
    } else onClose();
  };
  const beginDelete = (id: string) => {
    confirmationFocus.current = document.activeElement as HTMLElement;
    remove.reset();
    setDeleteId(id);
  };
  const date = (value: string) => new Date(value).toLocaleDateString(i18n.language);
  const fields = limit ? [
    [t('expenseLimits.details.currency'), limit.currency],
    [t('expenseLimits.details.period'), `${date(limit.startDate)} — ${date(limit.endDate)}`],
    [t('expenseLimits.details.rest'), formatMoney(limit.rest, currency)],
    [t('expenseLimits.details.total'), formatMoney(limit.total, currency)],
    [t('expenseLimits.details.spent'), formatMoney(limit.total - limit.rest, currency)],
  ] : [];
  const menuClass = `
    flex h-8 cursor-default items-center rounded-md px-2 text-sm outline-none data-highlighted:bg-accent
  `;
  return (
    <>
      <ScrollDialog.Base
        open
        onOpenChange={(open, details) => {
          if (open) return;
          if (pending || deleteId) {
            details.cancel();
            return;
          }
          if (mode === 'manage' && limitId && details.reason === 'escape-key') {
            details.cancel();
            cancel();
          } else onClose();
        }}
      >
        <ScrollDialog.Content
          ref={contentRef}
          finalFocus={finalFocus}
          className="max-w-2xl"
        >
          {mode === 'manage' && allowed ? (
            <ExpenseLimitManagement
              periodDate={periodDate}
              currency={currency}
              focusedLimitId={limitId}
              externalPending={remove.isPending || Boolean(deleteId)}
              onPendingChange={setSaving}
              onClose={close}
              onDelete={beginDelete}
            />
          ) : (
            <ScrollDialog.Layout
              title={t('expenseLimits.details.title')}
              closeLabel={t('expenseLimits.management.close')}
              onClose={close}
              closeDisabled={pending || Boolean(deleteId)}
              headerActions={allowed && limit ? (
                <Menu.Root>
                  <Menu.Trigger
                    ref={menuRef}
                    render={<Button.Icon />}
                    aria-label={t('expenseLimits.details.actions')}
                  >
                    <Icon icon="IcDots20" />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      align="end"
                      sideOffset={4}
                      className="z-50 outline-none"
                    >
                      <Menu.Popup
                        className="rounded-lg border bg-popover p-1 shadow-md outline-none"
                      >
                        <Menu.Item
                          className={menuClass}
                          label="Редактировать"
                          onClick={() => setMode('manage')}
                        >
                          Редактировать
                        </Menu.Item>
                        <Menu.Item
                          className={`${menuClass} text-destructive data-highlighted:bg-destructive/10`}
                          label="Удалить"
                          onClick={() => beginDelete(limit._id)}
                        >
                          Удалить
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              ) : undefined}
            >
              <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                {limit && (
                  <div className="min-w-0">
                    <dt className="text-caption-1 text-muted-foreground">
                      {t('expenseLimits.management.fields.category')}
                    </dt>
                    <dd className="flex items-start">
                      <ExpenseCategoryBadge color={limit.category.color}>{limit.category.name}</ExpenseCategoryBadge>
                    </dd>
                  </div>
                )}
                {fields.map(([label, value]) => (
                  <div className="min-w-0" key={label}>
                    <dt className="text-caption-1 text-muted-foreground">{label}</dt>
                    <dd className="whitespace-pre-wrap text-body-2 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </ScrollDialog.Layout>
          )}
        </ScrollDialog.Content>
      </ScrollDialog.Base>
      <DeleteExpenseLimitConfirmation
        open={Boolean(deleteId)}
        pending={remove.isPending}
        error={remove.isError ? t('expenseLimits.management.errors.generic') : undefined}
        finalFocus={() => (confirmationFocus.current?.isConnected ? confirmationFocus.current
          : contentRef.current?.querySelector<HTMLButtonElement>('button') ?? false)}
        onCancel={() => {
          if (!remove.isPending) setDeleteId(undefined);
        }}
        onConfirm={async () => {
          if (!deleteId || pending || !allowed) return;
          try {
            await remove.mutateAsync(deleteId);
            setDeleteId(undefined);
            if (deleteId === limitId) onUnavailable();
          } catch { /* The confirmation exposes the mutation error for retry. */ }
        }}
      />
    </>
  );
}
