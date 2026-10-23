import { useBudgetPermission } from '@/entities/budgets';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import {
  useExpenseCategoriesQueryOptions,
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
} from '@/entities/expense-categories';
import { Icon } from '@/shared/ui/icon';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { LucidePlus, LucideX } from 'lucide-react';
import {
  type FC,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CategoryDraft,
  CategoryDraftMutationError,
} from '../model/category-draft';
import {
  createCategoryDraft,
  createCategoryDrafts,
  createEmptyCategoryDraft,
  emptyCategoryFormValues,
} from '../model/category-draft';
import {
  getCategoryDraftErrors,
  useCategoryForm,
} from '../model/category-form';
import {
  getCategoryMutationErrorMessage,
  isDuplicateCategoryError,
} from '../model/errors';
import { CategoryFormRow } from './category-form-row';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

export const ManageExpenseCategoriesButton: FC = () => {
  const expenseCategoriesQueryOptions = useExpenseCategoriesQueryOptions();
  const allowed = useBudgetPermission('manageCategories');
  const { t } = useTranslation();
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const createMutation = useCreateExpenseCategoryMutation();
  const updateMutation = useUpdateExpenseCategoryMutation();
  const deleteMutation = useDeleteExpenseCategoryMutation();
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mutationErrors, setMutationErrors] = useState<
    Record<string, CategoryDraftMutationError | undefined>
  >({});
  const [deleteCategoryId, setDeleteCategoryId] = useState<string>();
  const form = useCategoryForm();

  const isPending = createMutation.isPending
    || updateMutation.isPending
    || deleteMutation.isPending;

  useEffect(() => {
    if (!open || initialized || categoriesQuery.data === undefined) return;

    form.reset(
      { drafts: createCategoryDrafts(categoriesQuery.data ?? []) },
      { keepDefaultValues: true },
    );
    setInitialized(true);
  }, [categoriesQuery.data, form, initialized, open]);

  const resetState = () => {
    form.reset(emptyCategoryFormValues, { keepDefaultValues: true });
    setMutationErrors({});
    setDeleteCategoryId(undefined);
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
          drafts: categoriesQuery.data ? createCategoryDrafts(categoriesQuery.data) : [],
        },
        { keepDefaultValues: true },
      );
      setInitialized(categoriesQuery.data !== undefined);
      setOpen(true);
      return;
    }

    setOpen(false);
  };

  const clearDraftMutationError = (
    key: string,
    field: 'name' | 'color',
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
    key: string,
    error: unknown,
  ) => {
    const duplicate = isDuplicateCategoryError(error);
    if (duplicate) {
      form.setFieldMeta(`drafts[${index}].values.name`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
    }

    setMutationErrors((current) => ({
      ...current,
      [key]: {
        field: duplicate ? 'name' : undefined,
        message: duplicate
          ? t('expenseCategories.management.validation.duplicateName')
          : getCategoryMutationErrorMessage(error),
      },
    }));
  };

  const resetRowMeta = (index: number) => {
    const resetFieldMeta = (field: `drafts[${number}].values.${'name' | 'color'}`) => {
      form.setFieldMeta(field, (meta) => ({
        ...meta,
        isTouched: false,
        isBlurred: false,
        isDirty: false,
        errorMap: {},
        errorSourceMap: {},
      }));
    };

    resetFieldMeta(`drafts[${index}].values.name`);
    resetFieldMeta(`drafts[${index}].values.color`);
  };

  const saveDraft = async (index: number) => {
    const drafts = form.getFieldValue('drafts');
    const draft = drafts[index];
    if (!draft) return;

    await form.validate('change');
    const errors = getCategoryDraftErrors(form, index);
    if (errors.name || errors.color) {
      form.setFieldMeta(`drafts[${index}].values.name`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
      form.setFieldMeta(`drafts[${index}].values.color`, (meta) => ({
        ...meta,
        isTouched: true,
      }));
      return;
    }

    const payload = {
      name: draft.values.name.trim(),
      color: draft.values.color,
    };

    try {
      const savedCategory = draft.categoryId
        ? await updateMutation.mutateAsync({
          categoryId: draft.categoryId,
          payload,
        })
        : await createMutation.mutateAsync({ payload });

      if (!savedCategory) {
        setDraftMutationError(index, draft.key, undefined);
        return;
      }

      await form.replaceFieldValue('drafts', index, createCategoryDraft(savedCategory));
      resetRowMeta(index);
      setMutationErrors((current) => ({
        ...current,
        [draft.key]: undefined,
      }));
    } catch (error) {
      setDraftMutationError(index, draft.key, error);
    }
  };

  const requestDelete = (draft: CategoryDraft, index: number) => {
    if (!draft.categoryId) {
      form.removeFieldValue('drafts', index);
      setMutationErrors((current) => ({
        ...current,
        [draft.key]: undefined,
      }));
      return;
    }

    deleteMutation.reset();
    setDeleteCategoryId(draft.categoryId);
  };

  const closeDeleteConfirmation = () => {
    deleteMutation.reset();
    setDeleteCategoryId(undefined);
  };

  const confirmDelete = async () => {
    if (!deleteCategoryId) return;

    await deleteMutation.mutateAsync({ categoryId: deleteCategoryId });
    const index = form.getFieldValue('drafts')
      .findIndex((draft) => draft.categoryId === deleteCategoryId);
    if (index >= 0) {
      await form.removeFieldValue('drafts', index);
    }
    setDeleteCategoryId(undefined);
  };

  if (!allowed) return null;
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
              aria-label={t('expenseCategories.management.open')}
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
            <Dialog.Title>{t('expenseCategories.management.title')}</Dialog.Title>
            <Button.Icon
              type="button"
              aria-label={t('expenseCategories.management.close')}
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              <LucideX />
            </Button.Icon>
          </Dialog.Header>

          <form.Subscribe selector={(state) => state.values.drafts}>
            {(drafts) => {
              const hasTemporaryDraft = drafts.some((draft) => !draft.categoryId);

              return (
                <Dialog.Body className="min-h-0">
                  <div className="min-h-0 overflow-y-auto pr-1">
                    {categoriesQuery.isLoading && !initialized && (
                      <div className="flex flex-col gap-3" aria-busy="true">
                        <span className="sr-only">{t('expenseCategories.management.loading')}</span>
                        <Skeleton className="h-[38px] w-full" />
                        <Skeleton className="h-[38px] w-full" />
                        <Skeleton className="h-[38px] w-full" />
                      </div>
                    )}

                    {categoriesQuery.isError && !initialized && (
                      <Typography.Body2 className="py-8 text-center text-destructive" role="alert">
                        {t('expenseCategories.management.errors.loading')}
                      </Typography.Body2>
                    )}

                    {initialized && !drafts.length && (
                      <Typography.Body1 className="py-8 text-center text-muted-foreground">
                        {t('expenseCategories.management.empty')}
                      </Typography.Body1>
                    )}

                    {initialized && drafts.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {drafts.map((draft, index) => {
                          const isSaving = createMutation.isPending
                            ? !draft.categoryId
                            : updateMutation.isPending
                              && updateMutation.variables?.categoryId === draft.categoryId;

                          return (
                            <CategoryFormRow
                              key={draft.key}
                              form={form}
                              draft={draft}
                              index={index}
                              mutationError={mutationErrors[draft.key]}
                              disabled={isPending}
                              isSaving={isSaving}
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
                    onClick={() => form.pushFieldValue('drafts', createEmptyCategoryDraft())}
                    disabled={!initialized || hasTemporaryDraft || isPending}
                  >
                    <LucidePlus />
                    {t('expenseCategories.management.add')}
                  </Button.Base>
                </Dialog.Body>
              );
            }}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Base>

      <DeleteConfirmDialog
        open={Boolean(deleteCategoryId)}
        pending={deleteMutation.isPending}
        error={deleteMutation.isError
          ? getCategoryMutationErrorMessage(deleteMutation.error)
          : undefined}
        onCancel={closeDeleteConfirmation}
        onConfirm={confirmDelete}
      />
    </>
  );
};
