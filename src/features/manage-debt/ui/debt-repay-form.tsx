import { type Debt, type useRepayDebtMutation } from '@/entities/debts';
import { AccountSelect, accountsQueryOptions, getPreferredAccountId } from '@/entities/accounts';
import { usersQueryOptions } from '@/entities/users';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { LucideCheck } from 'lucide-react';
import { type FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFirstFieldError, getMutationErrorMessage, mapErrorMessage } from '../model/errors';
import {
  getRepayDebtFormSchema,
  getRepayDebtFormValues,
  getEligibleDebtRepaymentAccounts,
} from '../model/repay-debt-form';

interface DebtRepayFormProps {
  debt: Debt;
  mutation: ReturnType<typeof useRepayDebtMutation>;
  onCancel: () => void;
  onSuccess: (updated: Debt | null) => void;
}

export const DebtRepayForm: FC<DebtRepayFormProps> = ({
  debt,
  mutation,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const mutationError = getMutationErrorMessage(mutation.error);
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const userQuery = useQuery(usersQueryOptions.me());
  const eligibleAccounts = getEligibleDebtRepaymentAccounts(accountsQuery.data ?? [], debt.currency);

  const form = useForm({
    defaultValues: getRepayDebtFormValues(debt),
    validators: { onSubmit: getRepayDebtFormSchema(debt.remainingAmount) },
    onSubmit: async ({ value }) => {
      const description = value.description.trim();
      const updated = await mutation.mutateAsync({
        debtId: debt._id,
        payload: {
          ...(value.isIncome ? { accountId: value.accountId } : {}),
          repaymentDate: value.repaymentDate,
          amount: Number(value.amount),
          description: description || undefined,
          isIncome: value.isIncome,
        },
      });

      mutation.reset();
      onSuccess(updated);
    },
  });

  useEffect(() => {
    if (form.state.values.accountId || !accountsQuery.isSuccess || !userQuery.isSuccess) return;
    const accountId = getPreferredAccountId(
      eligibleAccounts,
      userQuery.data?.defaultAccountId ?? null,
    );
    if (accountId) form.setFieldValue('accountId', accountId);
  }, [accountsQuery.isSuccess, eligibleAccounts, form, userQuery.data, userQuery.isSuccess]);

  const clearMutationError = () => {
    if (mutation.isError) mutation.reset();
  };

  const handleReset = () => {
    clearMutationError();
    form.reset(getRepayDebtFormValues(debt));
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
        <Dialog.Title>{t('debts.repay.title')}</Dialog.Title>
        <div className="flex gap-2.5">
          <form.Subscribe selector={(state) => state.values.isIncome}>
            {(isIncome) => (
              <Button.Base
                type="submit"
                disabled={mutation.isPending || (isIncome && eligibleAccounts.length === 0)}
              >
                <LucideCheck />
                {mutation.isPending ? t('debts.repay.repaying') : t('debts.repay.confirm')}
              </Button.Base>
            )}
          </form.Subscribe>
          <Button.Base
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            {t('debts.repay.cancel')}
          </Button.Base>
        </div>
      </Dialog.Header>

      <Dialog.Body>
        <Dialog.Description>{t('debts.repay.description')}</Dialog.Description>

        <form.Field name="repaymentDate">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Base
                  id="repay-debt-date"
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

        <form.Field name="amount">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
            const precisionError = field.state.value
              && !hasValidMoneyPrecision(Number(field.state.value), debt.currency)
              ? `Сумма не соответствует точности валюты ${debt.currency}`
              : undefined;
            const error = fieldError ?? precisionError;

            return (
              <div>
                <Input.Base
                  id="repay-debt-amount"
                  name={field.name}
                  type="number"
                  inputMode="decimal"
                  min={1 / (10 ** getCurrencyMinorUnits(debt.currency))}
                  max={debt.remainingAmount}
                  step={1 / (10 ** getCurrencyMinorUnits(debt.currency))}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.repay.fields.amount')}
                  hasError={Boolean(error)}
                  disabled={mutation.isPending}
                />
                {error && <Input.Error>{error}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="isIncome">
          {(field) => (
            <label
              className="
                flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2
                transition-colors
                has-disabled:cursor-not-allowed has-disabled:opacity-50
              "
              htmlFor="repay-debt-is-income"
            >
              <Typography.Body2>{t('debts.repay.fields.isIncome')}</Typography.Body2>
              <Switch
                id="repay-debt-is-income"
                name={field.name}
                checked={field.state.value}
                onBlur={field.handleBlur}
                onCheckedChange={(checked) => {
                  clearMutationError();
                  field.handleChange(checked);
                }}
                disabled={mutation.isPending}
              />
            </label>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.isIncome}>
          {(isIncome) => isIncome && (
            <form.Field name="accountId">
              {(field) => (
                <AccountSelect
                  id="repay-debt-account"
                  accounts={eligibleAccounts}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  label={`Счёт зачисления в ${debt.currency}`}
                  placeholder="Выберите счёт"
                  emptyMessage={`Нет активного счёта в ${debt.currency}`}
                  isLoading={accountsQuery.isLoading || userQuery.isLoading}
                  error={accountsQuery.isError || userQuery.isError
                    ? 'Не удалось загрузить счета'
                    : undefined}
                  disabled={mutation.isPending}
                  offerAccountCreation
                />
              )}
            </form.Field>
          )}
        </form.Subscribe>

        <form.Field name="description">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Base
                  id="repay-debt-description"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.repay.fields.description')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={1000}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <div className="flex justify-end">
          <Button.Base
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={mutation.isPending}
          >
            {t('debts.repay.reset')}
          </Button.Base>
        </div>

        {mutationError && (
          <Typography.Caption1 className="text-destructive">{mutationError}</Typography.Caption1>
        )}
      </Dialog.Body>
    </form>
  );
};
