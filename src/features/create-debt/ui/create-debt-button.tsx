import { Dialog as DialogPrimitive } from '@base-ui/react';
import { useForm, useStore } from '@tanstack/react-form';
import { useCreateDebtMutation } from '@/entities/debts';
import { currencyCodes, getCurrencyMinorUnits } from '@/shared/lib/currency';
import { getFirstFieldError, getMutationErrorMessage } from '@/shared/lib/form-errors';
import { clsx } from 'clsx';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Typography } from '@/shared/ui/typography';
import i18next from 'i18next';
import {
  LucideCheck,
  LucidePlus,
} from 'lucide-react';
import {
  type FC,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createDebtFormSchema,
  defaultCreateDebtFormValues,
  hasValidDebtAmountPrecision,
  normalizeDueDate,
} from '../model/create-debt-form';

interface CreateDebtButtonProps {
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
    default:
      return undefined;
  }
};

export const CreateDebtButton: FC<CreateDebtButtonProps> = ({
  className,
}) => {
  const { t } = useTranslation();
  const createDebtMutation = useCreateDebtMutation();
  const [open, setOpen] = useState(false);

  const mutationError = getMutationErrorMessage(createDebtMutation.error);

  const form = useForm({
    defaultValues: defaultCreateDebtFormValues,
    validators: {
      onSubmit: createDebtFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!hasValidDebtAmountPrecision(value.amount, value.currency)) return;
      const principalAmount = Number(value.amount);

      try {
        await createDebtMutation.mutateAsync({
          payload: {
            debtor: value.debtor.trim(),
            currency: value.currency,
            principalAmount,
            dueDate: normalizeDueDate(value) || undefined,
          },
        });

        setOpen(false);
        formApi.reset();
        createDebtMutation.reset();
      } catch { /* Keep the draft and show the mutation error. */ }
    },
  });

  const selectedCurrency = useStore(form.store, (state) => state.values.currency);

  const resetForm = () => {
    form.reset();
    createDebtMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (createDebtMutation.isPending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const clearMutationError = () => {
    if (createDebtMutation.isError) {
      createDebtMutation.reset();
    }
  };

  return (
    <ScrollDialog.Base open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        className={clsx(
          `
            group/button inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)]
            transition-colors hover:bg-muted
          `,
          className,
        )}
        aria-label={t('debts.create.title')}
      >
        <LucidePlus className="size-5" />
      </DialogPrimitive.Trigger>

      <ScrollDialog.Content>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await form.handleSubmit();
          }}
        >
          <ScrollDialog.Layout
            title={t('debts.create.title')}
            closeLabel={t('debts.create.close')}
            onClose={() => handleOpenChange(false)}
            closeDisabled={createDebtMutation.isPending}
            actions={(
              <Button.Base type="submit" disabled={createDebtMutation.isPending}>
                <LucideCheck />
                {createDebtMutation.isPending ? t('debts.create.saving') : t('debts.create.save')}
              </Button.Base>
            )}
          >
            <form.Field name="currency">
              {(field) => (
                <div>
                  <Input.Label htmlFor="create-debt-currency">{t('debts.create.fields.currency')}</Input.Label>
                  <Select.Root
                    items={currencyCodes.map((currency) => ({ value: currency, label: currency }))}
                    value={field.state.value}
                    disabled={createDebtMutation.isPending}
                    onValueChange={(value) => {
                      if (value !== null) {
                        clearMutationError();
                        field.handleChange(value);
                      }
                    }}
                  >
                    <Select.Trigger
                      id="create-debt-currency"
                      size="form"
                      onBlur={field.handleBlur}
                    >
                      <Select.Value placeholder={t('debts.create.fields.currencyPlaceholder')} />
                    </Select.Trigger>
                    <Select.Content>
                      {currencyCodes.map((currency) => (
                        <Select.Item key={currency} value={currency}>{currency}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </div>
              )}
            </form.Field>

            <form.Field name="debtor">
              {(field) => {
                const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

                return (
                  <div>
                    <Input.Label htmlFor={field.name}>{t('debts.create.fields.name')}</Input.Label>
                    <Input.Base
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      placeholder={t('debts.create.fields.namePlaceholder')}
                      hasError={Boolean(fieldError)}
                      disabled={createDebtMutation.isPending}
                      maxLength={150}
                    />
                    {fieldError && <Input.Error>{fieldError}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="amount">
              {(field) => {
                const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
                const currency = selectedCurrency;
                const precisionError = field.state.value
                  && !hasValidDebtAmountPrecision(field.state.value, currency)
                  ? `Сумма не соответствует точности валюты ${currency}`
                  : undefined;
                const error = fieldError ?? precisionError;

                return (
                  <div>
                    <Input.Label htmlFor={field.name}>{t('debts.create.fields.amountLabel')}</Input.Label>
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
                      placeholder={t('debts.create.fields.amount')}
                      hasError={Boolean(error)}
                      disabled={createDebtMutation.isPending}
                    />
                    {error && <Input.Error>{error}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.dateMode}>
              {(dateMode) => (
                <div>
                  <Typography.Body2 id="create-debt-date-mode" className="mb-2">
                    {t('debts.create.fields.dateMode')}
                  </Typography.Body2>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div
                      role="group"
                      aria-labelledby="create-debt-date-mode"
                      className="flex items-center gap-2 rounded-lg bg-muted p-1"
                    >
                      <form.Field name="dateMode">
                        {(field) => (
                          <>
                            <button
                              type="button"
                              className={clsx(
                                `
                                  rounded-md px-3 py-1 text-caption-1 font-medium leading-normal transition-colors
                                  hover:text-foreground
                                `,
                                dateMode === 'day'
                                  ? 'bg-card text-foreground shadow-xs'
                                  : 'text-muted-foreground',
                              )}
                              aria-pressed={dateMode === 'day'}
                              onClick={() => {
                                clearMutationError();
                                field.handleChange('day');
                              }}
                              disabled={createDebtMutation.isPending}
                            >
                              {t('debts.create.dateModes.day')}
                            </button>
                            <button
                              type="button"
                              className={clsx(
                                `
                                  rounded-md px-3 py-1 text-caption-1 font-medium leading-normal transition-colors
                                  hover:text-foreground
                                `,
                                dateMode === 'month'
                                  ? 'bg-card text-foreground shadow-xs'
                                  : 'text-muted-foreground',
                              )}
                              aria-pressed={dateMode === 'month'}
                              onClick={() => {
                                clearMutationError();
                                field.handleChange('month');
                              }}
                              disabled={createDebtMutation.isPending}
                            >
                              {t('debts.create.dateModes.month')}
                            </button>
                          </>
                        )}
                      </form.Field>
                    </div>
                  </div>

                  <form.Field name={dateMode === 'day' ? 'dayDate' : 'monthDate'}>
                    {(field) => {
                      const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

                      return (
                        <>
                          <Input.Label htmlFor="create-debt-date">
                            {t(dateMode === 'day' ? 'debts.create.fields.dueDate' : 'debts.create.fields.monthDate')}
                          </Input.Label>
                          <Input.Base
                            placeholder={t('debts.create.fields.dueDate')}
                            id="create-debt-date"
                            name={field.name}
                            type={dateMode === 'day' ? 'date' : 'month'}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                              clearMutationError();
                              field.handleChange(event.target.value);
                            }}
                            hasError={Boolean(fieldError)}
                            disabled={createDebtMutation.isPending}
                          />
                          {fieldError && <Input.Error>{fieldError}</Input.Error>}
                          {dateMode === 'month' && (
                            <Typography.Caption1 className="mt-2 text-muted-foreground">
                              {t('debts.create.help.month')}
                            </Typography.Caption1>
                          )}
                        </>
                      );
                    }}
                  </form.Field>
                </div>
              )}
            </form.Subscribe>

            {mutationError && (
              <Typography.Caption1 className="text-destructive">
                {mutationError}
              </Typography.Caption1>
            )}
          </ScrollDialog.Layout>
        </form>
      </ScrollDialog.Content>
    </ScrollDialog.Base>
  );
};
