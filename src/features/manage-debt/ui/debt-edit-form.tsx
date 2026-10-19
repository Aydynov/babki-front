import { useQuery } from '@tanstack/react-query';
import { useDebtTransactionsQueryOptions } from '@/entities/debt-transactions';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { useBudget, useBudgetScope } from '@/entities/budgets';
import { type Debt, type useUpdateDebtMutation } from '@/entities/debts';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { LucideCheck } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { editDebtFormSchema, getEditDebtFormValues } from '../model/edit-debt-form';
import { getFirstFieldError, getMutationErrorMessage, mapErrorMessage } from '../model/errors';

interface DebtEditFormProps {
  debt: Debt;
  mutation: ReturnType<typeof useUpdateDebtMutation>;
  onCancel: () => void;
  onSuccess: (updated: Debt | null) => void;
}

export const DebtEditForm: FC<DebtEditFormProps> = ({
  debt,
  mutation,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const budgetTitle = useBudget().title;
  const scope = useBudgetScope();
  const history = useQuery({
    ...useDebtTransactionsQueryOptions().findAll(debt._id, { limit: 1 }),
    enabled: scope.kind === 'group',
  });
  const canChangePrincipal = scope.kind === 'group' && history.isSuccess && history.data.total === 0;
  const mutationError = getMutationErrorMessage(mutation.error);

  const form = useForm({
    defaultValues: getEditDebtFormValues(debt),
    validators: { onSubmit: editDebtFormSchema },
    onSubmit: async ({ value }) => {
      const principal = Number(value.principalAmount);
      if (canChangePrincipal && (!hasValidMoneyPrecision(principal, debt.currency) || principal <= 0)) return;
      const description = value.description.trim();
      const updated = await mutation.mutateAsync({
        debtId: debt._id,
        payload: {
          debtor: value.debtor.trim(),
          ...(canChangePrincipal ? { principalAmount: principal } : {}),
          description: description || undefined,
          dueDate: value.dueDate || (scope.kind === 'group' ? null : undefined),
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
        <Dialog.Title>{t('debts.edit.title')}</Dialog.Title>
        <div className="flex gap-2.5">
          <Button.Base type="submit" disabled={mutation.isPending}>
            <LucideCheck />
            {mutation.isPending ? t('debts.edit.saving') : t('debts.edit.save')}
          </Button.Base>
          <Button.Base
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            {t('debts.edit.cancel')}
          </Button.Base>
        </div>
      </Dialog.Header>

      <Dialog.Body>
        <Typography.Caption1 className="text-muted-foreground">
          Бюджет:
          {budgetTitle}
        </Typography.Caption1>
        {scope.kind === 'group' && (
          <form.Field name="principalAmount">
            {(field) => (
              <div>
                <label htmlFor="edit-debt-principal">
                  Первоначальная сумма (
                  {debt.currency}
                  )
                </label>
                <Input.Base
                  id="edit-debt-principal"
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
        )}
        <form.Field name="debtor">
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
                  placeholder={t('debts.edit.fields.debtor')}
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
                <Input.Base
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.edit.fields.description')}
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
                <Input.Base
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
      </Dialog.Body>
    </form>
  );
};
