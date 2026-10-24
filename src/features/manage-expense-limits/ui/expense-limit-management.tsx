import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LucidePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBudgetPermission } from '@/entities/budgets';
import { useExpenseCategoriesQueryOptions } from '@/entities/expense-categories';
import {
  getExpenseLimitsForCurrency, useExpenseLimitsQueryOptions,
  useCreateExpenseLimitMutation, useUpdateExpenseLimitMutation,
} from '@/entities/expense-limits';
import { formatMoney, type CurrencyCode } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { QueryError } from '@/shared/ui/query-error';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import {
  createEmptyExpenseLimitDraft, createExpenseLimitDraft, createExpenseLimitDrafts, getExpenseLimitMonthRange,
} from '../model/limit-draft';
import { getExpenseLimitDraftErrors, useExpenseLimitForm } from '../model/limit-form';
import type { ExpenseLimitDraftMutationError } from '../model/limit-draft';
import { getExpenseLimitMutationErrorMessage, isDuplicateExpenseLimitError } from '../model/errors';
import { ExpenseLimitFormRow } from './expense-limit-form-row';

export function ExpenseLimitManagement({
  periodDate, currency, focusedLimitId, externalPending, onPendingChange, onClose, onDelete,
}: {
  periodDate: string;
  currency: CurrencyCode;
  focusedLimitId?: string;
  externalPending: boolean;
  onPendingChange: (pending: boolean) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const allowed = useBudgetPermission('manageLimits');
  const query = useQuery(useExpenseLimitsQueryOptions().findAll({ periodDate }));
  const categories = useQuery(useExpenseCategoriesQueryOptions().findAll());
  const limits = useMemo(() => getExpenseLimitsForCurrency(query.data, currency), [query.data, currency]);
  const create = useCreateExpenseLimitMutation();
  const update = useUpdateExpenseLimitMutation();
  const pending = create.isPending || update.isPending || externalPending;
  const [initialized, setInitialized] = useState(false);
  const [errors, setErrors] = useState<Record<string, ExpenseLimitDraftMutationError | undefined>>({});
  const form = useExpenseLimitForm();
  useEffect(() => {
    onPendingChange(create.isPending || update.isPending);
  }, [create.isPending, update.isPending, onPendingChange]);
  useEffect(() => {
    if (initialized || !query.data) return;
    form.reset({ drafts: createExpenseLimitDrafts(limits) }, { keepDefaultValues: true });
    setInitialized(true);
  }, [form, initialized, limits, query.data]);
  useEffect(() => {
    if (!initialized || !focusedLimitId) return undefined;
    const frame = requestAnimationFrame(() => {
      const input = document.getElementById(`limit-total-${focusedLimitId}`);
      input?.scrollIntoView({ block: 'nearest' });
      input?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialized, focusedLimitId]);
  useEffect(() => {
    if (!initialized || !query.data) return;
    const ids = new Set(limits.map(({ _id }) => _id));
    const drafts = form.getFieldValue('drafts');
    for (let index = drafts.length - 1; index >= 0; index -= 1) {
      const id = drafts[index].limitId;
      if (id && !ids.has(id)) form.removeFieldValue('drafts', index);
    }
  }, [form, initialized, limits, query.data]);

  const save = async (index: number) => {
    if (!allowed || pending || query.isError) return;
    const draft = form.getFieldValue('drafts')[index];
    if (!draft) return;
    await form.validate('change');
    const invalid = getExpenseLimitDraftErrors(form, index);
    if (invalid.categoryId || invalid.total) return;
    if (!draft.limitId && (categories.isError || !categories.data?.some((category) => (
      category._id === draft.values.categoryId && !category.isArchived
    )))) return;
    setErrors((current) => ({ ...current, [draft.key]: undefined }));
    try {
      const total = Number(draft.values.total);
      const saved = draft.limitId
        ? await update.mutateAsync({ limitId: draft.limitId, payload: { total } })
        : await create.mutateAsync({
          payload: {
            categoryId: draft.values.categoryId, currency, total, ...getExpenseLimitMonthRange(periodDate),
          },
        });
      const currentIndex = form.getFieldValue('drafts').findIndex((row) => row.key === draft.key);
      if (currentIndex >= 0) {
        await form.replaceFieldValue('drafts', currentIndex, createExpenseLimitDraft(saved));
      }
    } catch (cause) {
      setErrors((current) => ({
        ...current,
        [draft.key]: {
          field: !draft.limitId && isDuplicateExpenseLimitError(cause) ? 'categoryId' : undefined,
          message: !draft.limitId && isDuplicateExpenseLimitError(cause)
            ? t('expenseLimits.management.validation.duplicateCategory') : getExpenseLimitMutationErrorMessage(),
        },
      }));
    }
  };
  if (!allowed) return null;
  const month = new Date(periodDate).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  return (
    <ScrollDialog.Layout
      title={t('expenseLimits.management.title')}
      closeLabel={t('expenseLimits.management.close')}
      onClose={onClose}
      closeDisabled={pending}
    >
      <Typography.Caption1 className="text-muted-foreground">{`${month} · ${currency}`}</Typography.Caption1>
      {initialized && (
        <form.Subscribe selector={(state) => state.values.drafts}>
          {(drafts) => {
            const total = drafts.reduce((sum, draft) => {
              const value = Number(draft.values.total);
              return sum + (Number.isFinite(value) ? value : 0);
            }, 0);
            return (
              <div className="flex flex-col gap-1">
                <Typography.Caption1 className="text-muted-foreground">
                  {t('expenseLimits.management.summary')}
                </Typography.Caption1>
                <Typography.Title2 className="tabular-nums">
                  {formatMoney(total, currency)}
                </Typography.Title2>
              </div>
            );
          }}
        </form.Subscribe>
      )}
      {query.isLoading && <Skeleton className="h-16 w-full" />}
      {query.isError && (
      <QueryError
        compact
        onRetry={() => {
          query.refetch().catch(() => undefined);
        }}
      />
      )}
      {categories.isError && (
        <QueryError
          compact
          message={t('expenseLimits.management.errors.loadingCategories')}
          onRetry={() => {
            categories.refetch().catch(() => undefined);
          }}
        />
      )}
      <form.Subscribe selector={(state) => state.values.drafts}>
        {(drafts) => {
          const used = new Set(drafts.map((draft) => draft.values.categoryId));
          const available = (categories.data ?? []).filter((category) => (
            !category.isArchived && !used.has(category._id)
          ));
          const canAdd = initialized && !query.isError && categories.data !== undefined && !categories.isError
            && !pending && !drafts.some((draft) => !draft.limitId) && available.length > 0;
          return (
            <div className="flex flex-col gap-3">
              {initialized && !drafts.length && (
                <Typography.Body2 className="text-muted-foreground">
                  {t('expenseLimits.management.empty')}
                </Typography.Body2>
              )}
              {drafts.map((draft, index) => (
                <ExpenseLimitFormRow
                  key={draft.key}
                  form={form}
                  draft={draft}
                  index={index}
                  categoryOptions={(categories.data ?? []).filter((category) => !category.isArchived
                    && (!used.has(category._id) || category._id === draft.values.categoryId))}
                  mutationError={errors[draft.key]}
                  disabled={pending || query.isError || (!draft.limitId && (!categories.data || categories.isError))}
                  isSaving={draft.limitId
                    ? update.isPending && update.variables?.limitId === draft.limitId : create.isPending}
                  categoryAvailable={Boolean(draft.limitId) || Boolean(categories.data?.some((category) => (
                    category._id === draft.values.categoryId && !category.isArchived
                  )))}
                  onMutationErrorClear={(key, field) => setErrors((current) => {
                    if (current[key]?.field && current[key]?.field !== field) return current;
                    return { ...current, [key]: undefined };
                  })}
                  onDelete={() => {
                    if (draft.limitId) onDelete(draft.limitId);
                    else form.removeFieldValue('drafts', index);
                  }}
                  onSave={() => save(index)}
                />
              ))}
              <Button.Base
                type="button"
                variant="ghost"
                className="self-start"
                disabled={!canAdd}
                onClick={() => form.pushFieldValue('drafts', createEmptyExpenseLimitDraft(currency))}
              >
                <LucidePlus />
                {t('expenseLimits.management.add')}
              </Button.Base>
            </div>
          );
        }}
      </form.Subscribe>
    </ScrollDialog.Layout>
  );
}
