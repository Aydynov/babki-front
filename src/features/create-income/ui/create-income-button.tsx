import { useBudgetPermission } from '@/entities/budgets';
import { AccountSelect, useAccountsQueryOptions } from '@/entities/accounts';
import { useCreateIncomeMutation } from '@/entities/incomes';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import { useForm, useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { getFirstFieldError, getMutationErrorMessage } from '@/shared/lib/form-errors';
import { getCurrencyMinorUnits, type CurrencyCode } from '@/shared/lib/currency';
import { cn } from '@/shared/lib/shadcn-utils';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import i18next from 'i18next';
import {
  LucideCheck,
  LucidePlus,
} from 'lucide-react';
import {
  type FC,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createIncomeFormSchema,
  defaultCreateIncomeFormValues,
  getDefaultCreateIncomeFormValues,
  getIncomeAccounts,
  hasValidIncomeAmountPrecision,
  mapCreateIncomeDto,
} from '../model/create-income-form';

interface CreateIncomeButtonProps {
  className?: string;
  currency?: CurrencyCode;
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

export const CreateIncomeButton: FC<CreateIncomeButtonProps> = ({
  className,
  currency,
}) => {
  const canCreateAccount = useBudgetPermission('manageAccounts');
  const { t } = useTranslation();
  const createIncomeMutation = useCreateIncomeMutation();
  const accountsQueryOptions = useAccountsQueryOptions();
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const [open, setOpen] = useState(false);
  const accounts = useMemo(
    () => getIncomeAccounts(accountsQuery.data ?? [], currency),
    [accountsQuery.data, currency],
  );

  const mutationError = getMutationErrorMessage(createIncomeMutation.error);

  const form = useForm({
    defaultValues: defaultCreateIncomeFormValues,
    validators: {
      onSubmit: createIncomeFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const account = accounts.find(({ _id }) => _id === value.accountId);
      if (!account || !hasValidIncomeAmountPrecision(value.amount, account.currency)) return;
      if (value.transactionDate.slice(0, 10) < account.openedAt.slice(0, 10)) return;
      await createIncomeMutation.mutateAsync(mapCreateIncomeDto(value));

      setOpen(false);
      formApi.reset();
      createIncomeMutation.reset();
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const selectedAccount = accounts.find(({ _id }) => _id === values.accountId);
  useEffect(() => {
    if (open && accountsQuery.isSuccess && !selectedAccount) {
      form.setFieldValue('accountId', getDefaultCreateIncomeFormValues(accounts, currency).accountId);
    }
  }, [open, accountsQuery.isSuccess, accounts, currency, form, selectedAccount]);
  const amountPrecisionInvalid = selectedAccount !== undefined
    && values.amount.trim() !== ''
    && !hasValidIncomeAmountPrecision(values.amount, selectedAccount.currency);
  const activeAccountsUnavailable = accountsQuery.isLoading
    || !selectedAccount;
  const moneyStep = selectedAccount
    ? String(1 / (10 ** getCurrencyMinorUnits(selectedAccount.currency)))
    : '0.01';

  const resetForm = () => {
    form.reset();
    createIncomeMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (createIncomeMutation.isPending) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const clearMutationError = () => {
    if (createIncomeMutation.isError) {
      createIncomeMutation.reset();
    }
  };

  return (
    <ScrollDialog.Base open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        className={cn(
          `
            group/button inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)]
            transition-colors hover:bg-muted
          `,
          className,
        )}
        aria-label={currency ? t('incomes.create.open', { currency }) : t('incomes.create.openWithoutCurrency')}
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
            title={t('incomes.create.title')}
            closeLabel={t('incomes.create.close')}
            onClose={() => handleOpenChange(false)}
            closeDisabled={createIncomeMutation.isPending}
            actions={(
              <Button.Base
                type="submit"
                disabled={
                  createIncomeMutation.isPending
                  || activeAccountsUnavailable
                  || amountPrecisionInvalid
                }
              >
                <LucideCheck />
                {createIncomeMutation.isPending ? t('incomes.create.saving') : t('incomes.create.save')}
              </Button.Base>
            )}
          >
            <form.Field name="accountId">
              {(field) => {
                const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

                return (
                  <div>
                    <AccountSelect
                      id="create-income-account"
                      accounts={accounts}
                      value={field.state.value}
                      onValueChange={(value) => {
                        clearMutationError();
                        field.handleChange(value);
                      }}
                      label={t('incomes.create.fields.account')}
                      placeholder={t('incomes.create.accounts.placeholder')}
                      emptyMessage={t('incomes.create.accounts.empty', { currency })}
                      isLoading={accountsQuery.isLoading}
                      error={accountsQuery.isError
                        ? t('incomes.create.accounts.error')
                        : undefined}
                      disabled={createIncomeMutation.isPending}
                      offerAccountCreation={canCreateAccount}
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
                    <Input.Label htmlFor="description">{t('incomes.create.fields.description')}</Input.Label>
                    <Input.Base
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      placeholder={t('incomes.create.fields.descriptionPlaceholder')}
                      hasError={Boolean(fieldError)}
                      disabled={createIncomeMutation.isPending}
                      maxLength={1000}
                    />
                    {fieldError && <Input.Error>{fieldError}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="amount">
              {(field) => {
                const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
                const precisionError = amountPrecisionInvalid
                  ? t('incomes.create.validation.precision', {
                    currency: selectedAccount?.currency,
                  })
                  : undefined;
                const error = fieldError ?? precisionError;

                return (
                  <div>
                    <Input.Label htmlFor="amount">{t('incomes.create.fields.amountLabel')}</Input.Label>
                    <Input.Base
                      id={field.name}
                      name={field.name}
                      type="number"
                      inputMode="decimal"
                      min={moneyStep}
                      step={moneyStep}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      placeholder={t('incomes.create.fields.amount')}
                      hasError={Boolean(error)}
                      disabled={createIncomeMutation.isPending}
                    />
                    {error && <Input.Error>{error}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="transactionDate">
              {(field) => {
                const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

                return (
                  <div>
                    <Input.Label htmlFor="create-income-date">{t('incomes.create.fields.date')}</Input.Label>
                    <Input.Base
                      id="create-income-date"
                      name={field.name}
                      type="date"
                      min={selectedAccount?.openedAt.slice(0, 10)}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        clearMutationError();
                        field.handleChange(event.target.value);
                      }}
                      hasError={Boolean(fieldError)}
                      disabled={createIncomeMutation.isPending}
                    />
                    {fieldError && <Input.Error>{fieldError}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

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
