import { useQuery } from '@tanstack/react-query';
import { useDebtTransactionsQueryOptions } from '@/entities/debt-transactions';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { type Debt, type useUpdateDebtMutation } from '@/entities/debts';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { LucideArrowLeft, LucideCheck } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { editDebtFormSchema, getEditDebtFormValues } from '../model/edit-debt-form';
import { getFirstFieldError, getMutationErrorMessage, mapErrorMessage } from '../model/errors';

interface DebtEditFormProps {
  debt: Debt;
  mutation: ReturnType<typeof useUpdateDebtMutation>;
  onCancel: () => void;
  onClose: () => void;
  onSuccess: (updated: Debt | null) => void;
}

export const DebtEditForm: FC<DebtEditFormProps> = ({
  debt,
  mutation,
  onCancel,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const history = useQuery({
    ...useDebtTransactionsQueryOptions().findAll(debt._id, { limit: 1 }),
    enabled: true,
  });
  const canChangePrincipal = history.isSuccess && history.data.total === 0;
  const mutationError = getMutationErrorMessage(mutation.error);

  const form = useForm({
    defaultValues: getEditDebtFormValues(debt),
    validators: { onSubmit: editDebtFormSchema },
    onSubmit: async ({ value }) => {
      const principal = Number(value.principalAmount);
      if (canChangePrincipal && (!hasValidMoneyPrecision(principal, debt.currency) || principal <= 0)) return;
      const description = value.description.trim();
      try {
        const updated = await mutation.mutateAsync({
          debtId: debt._id,
          payload: {
            debtor: value.debtor.trim(),
            ...(canChangePrincipal ? { principalAmount: principal } : {}),
            description: description || undefined,
            dueDate: value.dueDate || null,
          },
        });

        mutation.reset();
        onSuccess(updated);
      } catch { /* Keep the draft and show the mutation error. */ }
    },
  });

  const clearMutationError = () => {
    if (mutation.isError) mutation.reset();
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <ScrollDialog.Layout
        title={t('debts.edit.title')}
        closeLabel={t('debts.details.close')}
        onClose={onClose}
        closeDisabled={mutation.isPending}
        actions={(
          <div className="flex gap-2.5">
            <Button.Icon
              type="button"
              onClick={onCancel}
              disabled={mutation.isPending}
              aria-label={t('debts.details.backToView')}
              title={t('debts.details.backToView')}
            >
              <LucideArrowLeft />
            </Button.Icon>
            <Button.Base type="submit" disabled={mutation.isPending}>
              <LucideCheck />
              {mutation.isPending ? t('debts.edit.saving') : t('debts.edit.save')}
            </Button.Base>
          </div>
        )}
      >
        <form.Field name="principalAmount">
          {(field) => (
            <div>
              <Input.Label htmlFor="edit-debt-principal">
                {t('debts.edit.fields.principalAmount', { currency: debt.currency })}
              </Input.Label>
              <Input.Base
                id="edit-debt-principal"
                placeholder={t('debts.edit.fields.amount')}
                type="number"
                value={field.state.value}
                step={1 / (10 ** getCurrencyMinorUnits(debt.currency))}
                min={1 / (10 ** getCurrencyMinorUnits(debt.currency))}
                disabled={!canChangePrincipal || mutation.isPending}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {!canChangePrincipal && (
              <Typography.Caption1>
                Сумма доступна для изменения только до появления любой истории.
              </Typography.Caption1>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="debtor">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Label htmlFor={`edit-debt-${field.name}`}>
                  {t('debts.edit.fields.debtor')}
                </Input.Label>
                <Input.Base
                  id={`edit-debt-${field.name}`}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.edit.fields.debtorPlaceholder')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={150}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Label htmlFor={`edit-debt-${field.name}`}>
                  {t('debts.edit.fields.description')}
                </Input.Label>
                <Input.Base
                  id={`edit-debt-${field.name}`}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.edit.fields.descriptionPlaceholder')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={150}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="dueDate">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Label htmlFor="edit-debt-date">{t('debts.edit.fields.dueDate')}</Input.Label>
                <Input.Base
                  placeholder={t('debts.edit.fields.dueDate')}
                  id="edit-debt-date"
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
      </ScrollDialog.Layout>
    </form>
  );
};
