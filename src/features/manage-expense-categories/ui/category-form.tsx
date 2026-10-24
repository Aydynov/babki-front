import { useState } from 'react';
import { LucideArrowLeft, LucideCheck } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  type ExpenseCategory, useExpenseCategoriesQueryOptions,
  useCreateExpenseCategoryMutation, useUpdateExpenseCategoryMutation,
} from '@/entities/expense-categories';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { QueryError } from '@/shared/ui/query-error';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Typography } from '@/shared/ui/typography';
import { ColorPicker } from './color-picker';
import { getCategoryFormSchema, type CategoryDraftFieldError } from '../model/validation';
import { isDuplicateCategoryError, mapCategoryFieldError } from '../model/errors';

export function CategoryForm({
  category, onClose, onCancel, onSaved, onPendingChange,
}: {
  category?: ExpenseCategory;
  onClose: () => void;
  onCancel: () => void;
  onSaved: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const categories = useQuery(useExpenseCategoriesQueryOptions().findAll());
  const create = useCreateExpenseCategoryMutation();
  const update = useUpdateExpenseCategoryMutation();
  const pending = create.isPending || update.isPending;
  const [baseline] = useState(() => ({
    name: category?.name ?? '', color: category?.color?.toUpperCase() ?? '', description: category?.description ?? '',
  }));
  const [error, setError] = useState<'duplicate' | 'generic' | null>(null);
  const form = useForm({
    defaultValues: baseline,
    validators: { onChange: getCategoryFormSchema(categories.data ?? [], category?._id) },
    onSubmit: async ({ value }) => {
      if (!categories.data || pending) return;
      const payload = getCategoryFormSchema(categories.data, category?._id).parse(value);
      onPendingChange(true);
      setError(null);
      try {
        if (category) await update.mutateAsync({ categoryId: category._id, payload });
        else await create.mutateAsync({ payload });
        onSaved();
      } catch (cause) {
        setError(isDuplicateCategoryError(cause) ? 'duplicate' : 'generic');
      } finally {
        onPendingChange(false);
      }
    },
  });
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit().catch(() => undefined);
      }}
    >
      <ScrollDialog.Layout
        title={t(category ? 'expenseCategories.management.editTitle' : 'expenseCategories.management.add')}
        closeLabel={t('expenseCategories.management.close')}
        onClose={onClose}
        closeDisabled={pending}
        actions={(
          <div className="flex gap-2">
            <Button.Icon
              type="button"
              aria-label={t('expenseCategories.management.delete.cancel')}
              title={t('expenseCategories.management.delete.cancel')}
              onClick={onCancel}
              disabled={pending}
            >
              <LucideArrowLeft />
            </Button.Icon>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => {
                const dirty = !category || values.name.trim() !== baseline.name.trim()
                  || values.color.toUpperCase() !== baseline.color || values.description !== baseline.description;
                const valid = categories.data
                  && getCategoryFormSchema(categories.data, category?._id).safeParse(values).success;
                return (
                  <Button.Base
                    type="submit"
                    disabled={pending || !dirty || !valid}
                    aria-busy={pending || undefined}
                  >
                    <LucideCheck />
                    {t(pending
                      ? 'expenseCategories.management.actions.saving' : 'expenseCategories.management.actions.save')}
                  </Button.Base>
                );
              }}
            </form.Subscribe>
          </div>
        )}
      >
        {categories.isError && (
        <QueryError
          compact
          onRetry={() => {
            categories.refetch().catch(() => undefined);
          }}
        />
        )}
        {(['name', 'description', 'color'] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => {
              const fieldError = field.state.meta.isTouched
                ? mapCategoryFieldError(
                  getFirstFieldError(field.state.meta.errors) as CategoryDraftFieldError | undefined,
                )
                : undefined;
              const message = name === 'name' && error === 'duplicate'
                ? t('expenseCategories.management.validation.duplicateName') : fieldError;
              const id = `category-${category?._id ?? 'new'}-${name}`;
              const label = t(`expenseCategories.management.fields.${name}`);
              return (
                <div>
                  <Input.Label htmlFor={name === 'color' ? undefined : id}>{label}</Input.Label>
                  {name === 'color' ? (
                    <ColorPicker
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      onBlur={field.handleBlur}
                      disabled={pending}
                      hasError={Boolean(message)}
                      label={label}
                      describedBy={message ? `${id}-error` : undefined}
                    />
                  ) : (
                    <Input.Base
                      id={id}
                      placeholder={t(`expenseCategories.management.placeholders.${name}`)}
                      value={field.state.value}
                      maxLength={name === 'name' ? 101 : 501}
                      disabled={pending}
                      hasError={Boolean(message)}
                      aria-invalid={Boolean(message) || undefined}
                      aria-describedby={message ? `${id}-error` : undefined}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        setError(null);
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                  {message && <Input.Error id={`${id}-error`} role="alert">{message}</Input.Error>}
                </div>
              );
            }}
          </form.Field>
        ))}
        {error === 'generic' && (
          <Typography.Body2 role="alert" className="text-destructive">
            {t('expenseCategories.management.errors.generic')}
          </Typography.Body2>
        )}
      </ScrollDialog.Layout>
    </form>
  );
}
