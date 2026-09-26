import { Dialog as DialogPrimitive } from '@base-ui/react';
import {
  expenseCategoriesQueryOptions,
  type CategorySelectOption,
} from '@/entities/expense-categories';
import {
  expenseLimitsQueryOptions,
  useCreateExpenseLimitMutation,
  useDeleteExpenseLimitMutation,
  useUpdateExpenseLimitMutation,
} from '@/entities/expense-limits';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import {
  LucidePlus,
  LucideX,
} from 'lucide-react';
import {
  type FC,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  getExpenseLimitMutationErrorMessage,
  getUnavailableExpenseLimitCategoryMessage,
  isDuplicateExpenseLimitError,
} from '../model/errors';
import type {
  ExpenseLimitDraft,
  ExpenseLimitDraftMutationError,
} from '../model/limit-draft';
import {
  commitExpenseLimitDraftTotal,
  createConfirmedExpenseLimitDraft,
  createEmptyExpenseLimitDraft,
  createExpenseLimitDraft,
  createExpenseLimitDrafts,
  emptyExpenseLimitFormValues,
  getExpenseLimitMonthRange,
  parseExpenseLimitTotal,
} from '../model/limit-draft';
import {
  getExpenseLimitDraftErrors,
  useExpenseLimitForm,
} from '../model/limit-form';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { ExpenseLimitFormRow } from './expense-limit-form-row';

interface ManageExpenseLimitsButtonProps {
  periodDate: string;
}

interface ConfirmedExpenseLimitCreate {
  category: CategorySelectOption;
  currency: ExpenseLimitDraft['values']['currency'];
  total: number;
}

type ConfirmedExpenseLimitCreates = Record<string, ConfirmedExpenseLimitCreate>;
type ConfirmedExpenseLimitCreatesByPeriod = Record<
  string,
  ConfirmedExpenseLimitCreates
>;

const EMPTY_CONFIRMED_CREATES: ConfirmedExpenseLimitCreates = {};

const getAvailableCategories = (
  categories: CategorySelectOption[],
  drafts: ExpenseLimitDraft[],
  currentDraftKey?: string,
) => {
  const currentCurrency = drafts.find(({ key }) => key === currentDraftKey)
    ?.values.currency ?? 'RUB';
  const usedCategoryIds = new Set(
    drafts
      .filter((draft) => draft.key !== currentDraftKey)
      .filter((draft) => draft.values.currency === currentCurrency)
      .map((draft) => draft.values.categoryId)
      .filter(Boolean),
  );

  return categories.filter((category) => !usedCategoryIds.has(category._id));
};

const createOpeningDrafts = (
  limits: Parameters<typeof createExpenseLimitDrafts>[0],
  confirmedCreates: ConfirmedExpenseLimitCreates,
) => {
  const drafts = createExpenseLimitDrafts(limits);
  const persistedCategoryIds = new Set(
    drafts.map((draft) => `${draft.values.categoryId}:${draft.values.currency}`),
  );
  const confirmedDrafts = Object.entries(confirmedCreates)
    .filter(([key]) => !persistedCategoryIds.has(key))
    .map(([, confirmed]) => createConfirmedExpenseLimitDraft(
      {
        ...createEmptyExpenseLimitDraft(),
        values: {
          ...createEmptyExpenseLimitDraft().values,
          currency: confirmed.currency,
        },
      },
      confirmed.category,
      confirmed.total,
    ));

  return [...drafts, ...confirmedDrafts];
};

export const ManageExpenseLimitsButton: FC<ManageExpenseLimitsButtonProps> = ({
  periodDate,
}) => {
  const periodKey = periodDate.slice(0, 7);
  const { t } = useTranslation();
  const limitsQuery = useQuery(
    expenseLimitsQueryOptions.findAll({ periodDate }),
  );
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const createMutation = useCreateExpenseLimitMutation();
  const updateMutation = useUpdateExpenseLimitMutation();
  const deleteMutation = useDeleteExpenseLimitMutation();
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mutationErrors, setMutationErrors] = useState<
    Record<string, ExpenseLimitDraftMutationError | undefined>
  >({});
  const [deleteLimitId, setDeleteLimitId] = useState<string>();
  const [confirmedCreatesByPeriod, setConfirmedCreatesByPeriod] = useState<
    ConfirmedExpenseLimitCreatesByPeriod
  >({});
  const confirmedCreates = confirmedCreatesByPeriod[periodKey]
    ?? EMPTY_CONFIRMED_CREATES;
  const form = useExpenseLimitForm();

  const isPending = createMutation.isPending
    || updateMutation.isPending
    || deleteMutation.isPending;
  const limitsLoadFailed = limitsQuery.isError || limitsQuery.data === null;
  const categoriesLoadFailed = categoriesQuery.isError || categoriesQuery.data === null;

  useEffect(() => {
    if (!open || initialized || limitsQuery.data == null) return;

    form.reset(
      { drafts: createOpeningDrafts(limitsQuery.data, confirmedCreates) },
      { keepDefaultValues: true },
    );
    setInitialized(true);
  }, [confirmedCreates, form, initialized, limitsQuery.data, open]);

  useEffect(() => {
    if (limitsQuery.data == null || !Object.keys(confirmedCreates).length) return;

    const resolvedLimits = limitsQuery.data.filter(
      (limit) => confirmedCreates[`${limit.category._id}:${limit.currency}`],
    );
    if (!resolvedLimits.length) return;

    if (open && initialized) {
      const drafts = form.getFieldValue('drafts');
      resolvedLimits.forEach((limit) => {
        const index = drafts.findIndex((draft) => (
          draft.writeConfirmed
          && draft.values.categoryId === limit.category._id
          && draft.values.currency === limit.currency
        ));
        if (index >= 0) {
          form.replaceFieldValue(
            'drafts',
            index,
            createExpenseLimitDraft(limit),
          );
        }
      });
    }

    setConfirmedCreatesByPeriod((current) => {
      const currentPeriod = current[periodKey] ?? EMPTY_CONFIRMED_CREATES;
      const nextPeriod = { ...currentPeriod };
      resolvedLimits.forEach((limit) => {
        delete nextPeriod[`${limit.category._id}:${limit.currency}`];
      });
      const next = { ...current };
      if (Object.keys(nextPeriod).length) {
        next[periodKey] = nextPeriod;
      } else {
        delete next[periodKey];
      }
      return next;
    });
  }, [confirmedCreates, form, initialized, limitsQuery.data, open, periodKey]);

  const resetState = () => {
    form.reset(emptyExpenseLimitFormValues, { keepDefaultValues: true });
    setMutationErrors({});
    setDeleteLimitId(undefined);
    setInitialized(false);
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  };

  const handleOpenChangeComplete = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;

    if (nextOpen) {
      form.reset(
        {
          drafts: limitsQuery.data
            ? createOpeningDrafts(limitsQuery.data, confirmedCreates)
            : [],
        },
        { keepDefaultValues: true },
      );
      setInitialized(limitsQuery.data != null);
      setOpen(true);
      return;
    }

    setOpen(false);
  };

  const clearDraftMutationError = (
    key: string,
    field: 'categoryId' | 'total',
  ) => {
    setMutationErrors((current) => {
      const mutationError = current[key];
      if (!mutationError || (mutationError.field && mutationError.field !== field)) {
        return current;
      }

      return {
        ...current,
        [key]: undefined,
      };
    });
  };

  const setDraftMutationError = (
    index: number,
    draft: ExpenseLimitDraft,
    error: unknown,
  ) => {
    const duplicate = !draft.limitId && isDuplicateExpenseLimitError(error);
    if (duplicate) {
      form.setFieldMeta(`drafts[${index}].values.categoryId`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
    }

    setMutationErrors((current) => ({
      ...current,
      [draft.key]: {
        field: duplicate ? 'categoryId' : undefined,
        message: duplicate
          ? t('expenseLimits.management.validation.duplicateCategory')
          : getExpenseLimitMutationErrorMessage(),
      },
    }));
  };

  const resetRowMeta = (index: number) => {
    const resetFieldMeta = (
      field: `drafts[${number}].values.${'categoryId' | 'total'}`,
    ) => {
      form.setFieldMeta(field, (meta) => ({
        ...meta,
        isTouched: false,
        isBlurred: false,
        isDirty: false,
        errorMap: {},
        errorSourceMap: {},
      }));
    };

    resetFieldMeta(`drafts[${index}].values.categoryId`);
    resetFieldMeta(`drafts[${index}].values.total`);
  };

  const saveDraft = async (index: number) => {
    const drafts = form.getFieldValue('drafts');
    const draft = drafts[index];
    if (!draft) return;

    await form.validate('change');
    const errors = getExpenseLimitDraftErrors(form, index);
    if (errors.categoryId || errors.total) {
      form.setFieldMeta(`drafts[${index}].values.categoryId`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
      form.setFieldMeta(`drafts[${index}].values.total`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
      return;
    }

    let selectedCategory: CategorySelectOption | undefined;
    if (!draft.limitId && !draft.writeConfirmed) {
      const availableCategories = categoriesQuery.data == null || categoriesLoadFailed
        ? []
        : getAvailableCategories(categoriesQuery.data, drafts, draft.key);
      selectedCategory = availableCategories.find(
        (category) => category._id === draft.values.categoryId,
      );

      if (!selectedCategory) {
        form.setFieldMeta(`drafts[${index}].values.categoryId`, (meta) => ({
          ...meta,
          isTouched: true,
        }));
        setMutationErrors((current) => ({
          ...current,
          [draft.key]: {
            field: 'categoryId',
            message: getUnavailableExpenseLimitCategoryMessage(),
          },
        }));
        return;
      }
    }

    const total = parseExpenseLimitTotal(draft.values.total);
    if (total === undefined) return;

    try {
      const savedLimit = draft.limitId
        ? await updateMutation.mutateAsync({
          limitId: draft.limitId,
          payload: { total },
        })
        : await createMutation.mutateAsync({
          payload: {
            categoryId: draft.values.categoryId,
            currency: draft.values.currency,
            total,
            ...getExpenseLimitMonthRange(periodDate),
          },
        });

      if (!savedLimit && !draft.limitId && selectedCategory) {
        await form.replaceFieldValue(
          'drafts',
          index,
          createConfirmedExpenseLimitDraft(draft, selectedCategory, total),
        );
        resetRowMeta(index);
        setConfirmedCreatesByPeriod((current) => ({
          ...current,
          [periodKey]: {
            ...current[periodKey],
            [`${selectedCategory._id}:${draft.values.currency}`]: {
              category: selectedCategory,
              currency: draft.values.currency,
              total,
            },
          },
        }));
        setMutationErrors((current) => ({
          ...current,
          [draft.key]: undefined,
        }));
        return;
      }

      await form.replaceFieldValue(
        'drafts',
        index,
        savedLimit
          ? createExpenseLimitDraft(savedLimit)
          : commitExpenseLimitDraftTotal(draft, total),
      );
      resetRowMeta(index);
      setMutationErrors((current) => ({
        ...current,
        [draft.key]: undefined,
      }));
    } catch (error) {
      setDraftMutationError(index, draft, error);
    }
  };

  const requestDelete = (draft: ExpenseLimitDraft, index: number) => {
    if (draft.writeConfirmed) return;

    if (!draft.limitId) {
      form.removeFieldValue('drafts', index);
      setMutationErrors((current) => ({
        ...current,
        [draft.key]: undefined,
      }));
      return;
    }

    deleteMutation.reset();
    setDeleteLimitId(draft.limitId);
  };

  const closeDeleteConfirmation = () => {
    deleteMutation.reset();
    setDeleteLimitId(undefined);
  };

  const confirmDelete = async () => {
    if (!deleteLimitId) return;

    try {
      await deleteMutation.mutateAsync(deleteLimitId);
    } catch {
      return;
    }

    const index = form.getFieldValue('drafts')
      .findIndex((draft) => draft.limitId === deleteLimitId);
    if (index >= 0) {
      await form.removeFieldValue('drafts', index);
    }
    setDeleteLimitId(undefined);
  };

  return (
    <>
      <Dialog.Base
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        <DialogPrimitive.Trigger
          render={(
            <Button.Icon
              type="button"
              aria-label={t('expenseLimits.management.open')}
            />
          )}
        >
          <Icon icon="IcGear20" />
        </DialogPrimitive.Trigger>

        <Dialog.Content
          className="
            flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col overflow-hidden
          "
        >
          <Dialog.Header className="shrink-0">
            <Dialog.Title>{t('expenseLimits.management.title')}</Dialog.Title>
            <Button.Icon
              type="button"
              aria-label={t('expenseLimits.management.close')}
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              <LucideX />
            </Button.Icon>
          </Dialog.Header>

          <form.Subscribe selector={(state) => state.values.drafts}>
            {(drafts) => {
              const categories = categoriesQuery.data ?? [];
              const categoriesReady = categoriesQuery.data != null
                && !categoriesLoadFailed;
              const hasTemporaryDraft = drafts.some((draft) => (
                !draft.limitId && !draft.writeConfirmed
              ));
              const unusedCategories = getAvailableCategories(categories, drafts);
              const canAdd = initialized
                && !limitsLoadFailed
                && categoriesReady
                && !hasTemporaryDraft
                && unusedCategories.length > 0
                && !isPending;

              return (
                <Dialog.Body className="min-h-0">
                  <div className="min-h-0 overflow-y-auto pr-1">
                    {limitsQuery.isLoading && !initialized && (
                      <div className="flex flex-col gap-3" aria-busy="true">
                        <span className="sr-only">{t('expenseLimits.management.loading')}</span>
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-11 w-full" />
                      </div>
                    )}

                    {limitsLoadFailed && (
                      <Typography.Body2 className="py-8 text-center text-destructive" role="alert">
                        {t('expenseLimits.management.errors.loadingLimits')}
                      </Typography.Body2>
                    )}

                    {initialized && categoriesLoadFailed && (
                      <Typography.Caption1 className="mb-3 text-destructive" role="alert">
                        {t('expenseLimits.management.errors.loadingCategories')}
                      </Typography.Caption1>
                    )}

                    {initialized && !drafts.length && (
                      <Typography.Body1 className="py-8 text-center text-muted-foreground">
                        {t('expenseLimits.management.empty')}
                      </Typography.Body1>
                    )}

                    {initialized && drafts.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {drafts.map((draft, index) => {
                          const isSaving = createMutation.isPending
                            ? !draft.limitId && !draft.writeConfirmed
                            : updateMutation.isPending
                              && updateMutation.variables?.limitId === draft.limitId;
                          const categoryOptions = draft.limitId || draft.writeConfirmed
                            ? []
                            : categoriesReady
                              ? getAvailableCategories(categories, drafts, draft.key)
                              : [];
                          const categoryAvailable = Boolean(
                            draft.limitId || draft.writeConfirmed,
                          )
                            || !categoriesReady
                            || categoryOptions.some(
                              (category) => category._id === draft.values.categoryId,
                            );
                          const rowDisabled = isPending
                            || limitsLoadFailed
                            || Boolean(draft.writeConfirmed)
                            || (!draft.limitId && !categoriesReady);

                          return (
                            <ExpenseLimitFormRow
                              key={draft.key}
                              form={form}
                              draft={draft}
                              index={index}
                              categoryOptions={categoryOptions}
                              mutationError={mutationErrors[draft.key]}
                              disabled={rowDisabled}
                              isSaving={isSaving}
                              categoryAvailable={categoryAvailable}
                              onMutationErrorClear={clearDraftMutationError}
                              onDelete={() => requestDelete(draft, index)}
                              onSave={() => saveDraft(index)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button.Base
                    type="button"
                    variant="outline"
                    className="w-full shrink-0"
                    onClick={() => form.pushFieldValue(
                      'drafts',
                      createEmptyExpenseLimitDraft(),
                    )}
                    disabled={!canAdd}
                  >
                    <LucidePlus />
                    {t('expenseLimits.management.add')}
                  </Button.Base>
                </Dialog.Body>
              );
            }}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Base>

      <DeleteConfirmDialog
        open={Boolean(deleteLimitId)}
        pending={deleteMutation.isPending}
        error={deleteMutation.isError
          ? getExpenseLimitMutationErrorMessage()
          : undefined}
        onCancel={closeDeleteConfirmation}
        onConfirm={confirmDelete}
      />
    </>
  );
};
