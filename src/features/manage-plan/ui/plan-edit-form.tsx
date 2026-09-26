import { type Plan, type useUpdatePlanMutation } from '@/entities/plans';
import { CategorySelect, expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { LucideCheck } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { editPlanFormSchema, getEditPlanFormValues } from '../model/edit-plan-form';
import { getFirstFieldError, getMutationErrorMessage, mapErrorMessage } from '../model/errors';

interface PlanEditFormProps {
  plan: Plan;
  mutation: ReturnType<typeof useUpdatePlanMutation>;
  onCancel: () => void;
  onSuccess: (updated: Plan | null) => void;
}

export const PlanEditForm: FC<PlanEditFormProps> = ({
  plan,
  mutation,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { data: categoriesData } = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesData ?? [];
  const mutationError = getMutationErrorMessage(mutation.error);

  const form = useForm({
    defaultValues: getEditPlanFormValues(plan),
    validators: { onSubmit: editPlanFormSchema },
    onSubmit: async ({ value }) => {
      const updated = await mutation.mutateAsync({
        planId: plan._id,
        payload: {
          description: value.description.trim(),
          categoryId: value.categoryId,
          amount: Number(value.amount),
          targetDate: value.targetDate,
        },
      });

      mutation.reset();
      onSuccess(updated);
    },
  });

  const clearMutationError = () => {
    if (mutation.isError) mutation.reset();
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <Dialog.Header>
        <Dialog.Title>{t('plans.edit.title')}</Dialog.Title>
        <div className="flex gap-2.5">
          <Button.Base type="submit" disabled={mutation.isPending}>
            <LucideCheck />
            {mutation.isPending ? t('plans.edit.saving') : t('plans.edit.save')}
          </Button.Base>
          <Button.Base
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            {t('plans.edit.cancel')}
          </Button.Base>
        </div>
      </Dialog.Header>

      <Dialog.Body>
        <Typography.Caption1 className="text-muted-foreground">
          Валюта плана:
          {' '}
          {plan.currency}
        </Typography.Caption1>
        <form.Field name="description">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
            return (
              <div>
                <Input.Base
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('plans.edit.fields.description')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={500}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="categoryId">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <CategorySelect
                  options={categories}
                  value={field.state.value}
                  onValueChange={(value) => {
                    clearMutationError();
                    field.handleChange(value);
                  }}
                  onBlur={field.handleBlur}
                  placeholder={t('plans.edit.fields.category')}
                  disabled={mutation.isPending}
                  hasError={Boolean(fieldError)}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="amount">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
            const precisionError = field.state.value
              && !hasValidMoneyPrecision(Number(field.state.value), plan.currency)
              ? `Сумма не соответствует точности валюты ${plan.currency}`
              : undefined;
            const error = fieldError ?? precisionError;

            return (
              <div>
                <Input.Base
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="decimal"
                  min={1 / (10 ** getCurrencyMinorUnits(plan.currency))}
                  step={1 / (10 ** getCurrencyMinorUnits(plan.currency))}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('plans.edit.fields.amount')}
                  hasError={Boolean(error)}
                  disabled={mutation.isPending}
                />
                {error && <Input.Error>{error}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="targetDate">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Base
                  id="edit-plan-date"
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        {mutationError && (
          <Typography.Caption1 className="text-destructive">{mutationError}</Typography.Caption1>
        )}
      </Dialog.Body>
    </form>
  );
};
