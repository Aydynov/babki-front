import { useBudgetPermission } from '@/entities/budgets';
import { type Debt, type useRepayDebtMutation } from '@/entities/debts';
import { AccountSelect, useAccountsQueryOptions } from '@/entities/accounts';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { LucideArrowLeft, LucideCheck, LucideUndo2 } from 'lucide-react';
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
  onClose: () => void;
  onSuccess: (updated: Debt | null) => void;
}

export const DebtRepayForm: FC<DebtRepayFormProps> = ({
  debt,
  mutation,
  onCancel,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const canCreateAccount = useBudgetPermission('manageAccounts');
  const mutationError = getMutationErrorMessage(mutation.error);
  const accountsQuery = useQuery(useAccountsQueryOptions().findAll());
  const eligibleAccounts = getEligibleDebtRepaymentAccounts(accountsQuery.data ?? [], debt.currency);

  const accountsUnavailable = !accountsQuery.isSuccess || eligibleAccounts.length === 0;
  const defaultAccountId = getRepayDebtFormValues(debt, accountsQuery.data).accountId;

  const form = useForm({
    defaultValues: getRepayDebtFormValues(debt, accountsQuery.isSuccess ? accountsQuery.data : []),
    validators: { onSubmit: getRepayDebtFormSchema(debt.remainingAmount) },
    onSubmit: async ({ value }) => {
      if (!hasValidMoneyPrecision(Number(value.amount), debt.currency)) return;
      if (value.isIncome && (accountsUnavailable
        || !eligibleAccounts.some((account) => account._id === value.accountId))) return;
      const description = value.description.trim();
      try {
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
      } catch { /* Keep the draft and show the mutation error. */ }
    },
  });

  useEffect(() => {
    if (!accountsQuery.isSuccess || mutation.isPending) return;
    const selectedId = form.getFieldValue('accountId');
    if (!eligibleAccounts.some((account) => account._id === selectedId) && selectedId !== defaultAccountId) {
      form.setFieldValue('accountId', defaultAccountId);
    }
  }, [accountsQuery.isSuccess, eligibleAccounts, defaultAccountId, form, mutation.isPending]);

  const clearMutationError = () => {
    if (mutation.isError) mutation.reset();
  };

  const handleReset = () => {
    clearMutationError();
    form.reset(getRepayDebtFormValues(debt, accountsQuery.isSuccess ? accountsQuery.data : []));
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
        title={t('debts.repay.title')}
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
            <Button.Icon
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={mutation.isPending}
              aria-label={t('debts.repay.reset')}
              title={t('debts.repay.reset')}
            >
              <LucideUndo2 />
            </Button.Icon>
            <form.Subscribe selector={(state) => state.values.isIncome}>
              {(isIncome) => (
                <Button.Base type="submit" disabled={mutation.isPending || (isIncome && accountsUnavailable)}>
                  <LucideCheck />
                  {mutation.isPending ? t('debts.repay.repaying') : t('debts.repay.confirm')}
                </Button.Base>
              )}
            </form.Subscribe>
          </div>
        )}
      >
        <Dialog.Description>{t('debts.repay.description')}</Dialog.Description>

        <form.Field name="repaymentDate">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Label htmlFor="repay-debt-date">
                  {t('debts.repay.fields.repaymentDate', { currency: debt.currency })}
                </Input.Label>
                <Input.Base
                  id="repay-debt-date"
                  placeholder={t('debts.repay.fields.repaymentDate')}
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
                <Input.Label htmlFor="repay-debt-amount">
                  {t('debts.repay.fields.amountLabel', { currency: debt.currency })}
                </Input.Label>
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
                  label={t('debts.repay.fields.account', { currency: debt.currency })}
                  placeholder={t('debts.repay.fields.accountPlaceholder')}
                  emptyMessage={`Нет активного счёта в ${debt.currency}`}
                  isLoading={accountsQuery.isLoading}
                  error={accountsQuery.isError
                    ? 'Не удалось загрузить счета'
                    : undefined}
                  disabled={mutation.isPending}
                  offerAccountCreation={canCreateAccount}
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
                <Input.Label htmlFor="repay-debt-description">
                  {t('debts.repay.fields.description', { currency: debt.currency })}
                </Input.Label>
                <Input.Base
                  id="repay-debt-description"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('debts.repay.fields.descriptionPlaceholder')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={1000}
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
