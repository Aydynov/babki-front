import { CategorySelect, expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { useCreatePlanMutation } from '@/entities/plans';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { getFirstFieldError, getMutationErrorMessage } from '@/shared/lib/form-errors';
import { currencyCodes, getCurrencyMinorUnits } from '@/shared/lib/currency';
import { cn } from '@/shared/lib/shadcn-utils';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import i18next from 'i18next';
import {
  LucideCheck,
  LucidePlus,
  LucideX,
} from 'lucide-react';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createPlanFormSchema,
  defaultCreatePlanFormValues,
  hasValidPlanAmountPrecision,
} from '../model/create-plan-form';

interface CreatePlanButtonProps {
  className?: string;
}

const mapErrorMessage = (code: string | undefined) => {
  switch (code) {
    case 'required':
      return i18next.t('validation.required');
    case 'invalid':
      return i18next.t('validation.amountInvalid');
    case 'min':
      return i18next.t('validation.amountMin');
    case 'tooLong':
      return i18next.t('validation.nameTooLong');
    case 'descriptionTooLong':
      return i18next.t('validation.descriptionTooLong');
    default:
      return undefined;
  }
};

export const CreatePlanButton: FC<CreatePlanButtonProps> = ({ className }) => {
  const { t } = useTranslation();
  const { data: categoriesData } = useQuery(expenseCategoriesQueryOptions.findAll());
  const categories = categoriesData ?? [];
  const createPlanMutation = useCreatePlanMutation();
  const [open, setOpen] = useState(false);

  const mutationError = getMutationErrorMessage(createPlanMutation.error);

  const form = useForm({
    defaultValues: defaultCreatePlanFormValues,
    validators: { onSubmit: createPlanFormSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!hasValidPlanAmountPrecision(value.amount, value.currency)) return;
      await createPlanMutation.mutateAsync({
        currency: value.currency,
        description: value.description.trim(),
        categoryId: value.categoryId,
        amount: Number(value.amount),
        targetDate: value.targetDate,
      });

      setOpen(false);
      formApi.reset();
      createPlanMutation.reset();
    },
  });

  const resetForm = () => {
    form.reset();
    createPlanMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (createPlanMutation.isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const clearMutationError = () => {
    if (createPlanMutation.isError) createPlanMutation.reset();
  };

  return (
    <Dialog.Base open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        className={cn(
          `
            group/button inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)]
            transition-colors hover:bg-muted
          `,
          className,
        )}
        aria-label={t('plans.create.title')}
      >
        <LucidePlus className="size-5" />
      </DialogPrimitive.Trigger>

      <Dialog.Content>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await form.handleSubmit();
          }}
        >
          <Dialog.Header>
            <Dialog.Title>{t('plans.create.title')}</Dialog.Title>
            <div className="flex gap-2.5">
              <Button.Base type="submit" disabled={createPlanMutation.isPending}>
                <LucideCheck />
                {createPlanMutation.isPending ? t('plans.create.saving') : t('plans.create.save')}
              </Button.Base>
              <button
                type="button"
                className={cn(
                  `
                    inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground
                    transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50
                  `,
                )}
                onClick={() => handleOpenChange(false)}
                aria-label={t('plans.create.close')}
                disabled={createPlanMutation.isPending}
              >
                <LucideX className="size-4" />
              </button>
            </div>
          </Dialog.Header>

          <Dialog.Body>
            <form.Field name="currency">
              {(field) => (
                <div>
                  <Input.Label htmlFor="create-plan-currency">Валюта</Input.Label>
                  <select
                    id="create-plan-currency"
                    className="h-11 w-full rounded-lg border bg-background px-3"
                    value={field.state.value}
                    disabled={createPlanMutation.isPending}
                    onChange={(event) => field.handleChange(event.target.value)}
                  >
                    {currencyCodes.map((currency) => <option key={currency}>{currency}</option>)}
                  </select>
                </div>
              )}
            </form.Field>

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
                      placeholder={t('plans.create.fields.description')}
                      hasError={Boolean(fieldError)}
                      disabled={createPlanMutation.isPending}
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
                      placeholder={t('plans.create.fields.category')}
                      disabled={createPlanMutation.isPending}
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
                const currency = form.getFieldValue('currency');
                const precisionError = field.state.value
                  && !hasValidPlanAmountPrecision(field.state.value, currency)
                  ? `Сумма не соответствует точности валюты ${currency}`
                  : undefined;
                const error = fieldError ?? precisionError;

                return (
                  <div>
                    <Input.Base
                      id={field.name}
                      name={field.name}
                      type="number"
                      inputMode="decimal"
                      min={1 / (10 ** getCurrencyMinorUnits(currency))}
                      step={1 / (10 ** getCurrencyMinorUnits(currency))}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      placeholder={t('plans.create.fields.amount')}
                      hasError={Boolean(error)}
                      disabled={createPlanMutation.isPending}
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
                  <>
                    <Input.Base
                      id="create-plan-date"
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      hasError={Boolean(fieldError)}
                      disabled={createPlanMutation.isPending}
                    />
                    {fieldError && <Input.Error>{fieldError}</Input.Error>}
                  </>
                );
              }}
            </form.Field>

            {mutationError && (
              <Typography.Caption1 className="text-destructive">
                {mutationError}
              </Typography.Caption1>
            )}
          </Dialog.Body>
        </form>
      </Dialog.Content>
    </Dialog.Base>
  );
};
