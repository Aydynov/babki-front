import { BudgetLabel, useBudget, useBudgetPermission } from '@/entities/budgets';
import { z } from 'zod';
import { AccountSelect, useAccountsQueryOptions } from '@/entities/accounts';
import { useCreateIncomeMutation } from '@/entities/incomes';
import { usersQueryOptions } from '@/entities/users';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import { useForm, useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { getFirstFieldError, getMutationErrorMessage } from '@/shared/lib/form-errors';
import { getCurrencyMinorUnits, type CurrencyCode } from '@/shared/lib/currency';
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
  getIncomeInitialAccountId,
  getIncomeAccounts,
  hasValidIncomeAmountPrecision,
  mapCreateIncomeDto,
} from '../model/create-income-form';

interface CreateIncomeButtonProps {
  className?: string;
  currency: CurrencyCode;
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
  const { scope } = useBudget();
  const canCreateAccount = useBudgetPermission('manageAccounts');
  const { t } = useTranslation();
  const createIncomeMutation = useCreateIncomeMutation();
  const accountsQueryOptions = useAccountsQueryOptions();
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const userQuery = useQuery(usersQueryOptions.me());
  const [open, setOpen] = useState(false);
  const accounts = useMemo(
    () => (scope.kind === 'group'
      ? (accountsQuery.data ?? []).filter((a) => a.archivedAt === null && a.currency === currency)
      : getIncomeAccounts(accountsQuery.data ?? [], currency)),
    [accountsQuery.data, currency, scope.kind],
  );

  const mutationError = getMutationErrorMessage(createIncomeMutation.error);

  const form = useForm({
    defaultValues: defaultCreateIncomeFormValues,
    validators: {
      onSubmit: scope.kind === 'group' ? createIncomeFormSchema.extend({
        source: z.string().max(1000),
        amount: z.string().refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'min'),
      }) : createIncomeFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const account = accounts.find(({ _id }) => _id === value.accountId);
      if (!account || !hasValidIncomeAmountPrecision(value.amount, account.currency)) return;
      if (value.transactionDate.slice(0, 10) < account.openedAt.slice(0, 10)) return;
      await createIncomeMutation.mutateAsync(scope.kind === 'group'
        ? {
          accountId: value.accountId,
          amount: Number(value.amount),
          transactionDate: value.transactionDate,
          description: value.source.trim(),
        }
        : mapCreateIncomeDto(value));

      setOpen(false);
      formApi.reset();
      createIncomeMutation.reset();
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const selectedAccount = accounts.find(({ _id }) => _id === values.accountId);
  const amountPrecisionInvalid = selectedAccount !== undefined
    && values.amount.trim() !== ''
    && !hasValidIncomeAmountPrecision(values.amount, selectedAccount.currency);
  const activeAccountsUnavailable = accountsQuery.isLoading
    || userQuery.isLoading
    || !selectedAccount;
  const moneyStep = selectedAccount
    ? String(1 / (10 ** getCurrencyMinorUnits(selectedAccount.currency)))
    : '0.01';

  useEffect(() => {
    if (scope.kind === 'group') return;
    if (
      !open
      || !accountsQuery.isSuccess
      || !userQuery.isSuccess
    ) return;

    if (values.accountId) {
      if (!selectedAccount) form.setFieldValue('accountId', '');
      return;
    }

    const accountId = getIncomeInitialAccountId(
      accounts,
      userQuery.data?.defaultAccountId ?? null,
    );
    if (accountId) form.setFieldValue('accountId', accountId);
  }, [
    accounts,
    scope.kind,
    accountsQuery.isSuccess,
    form,
    open,
    userQuery.data,
    userQuery.isSuccess,
    values.accountId,
    selectedAccount,
  ]);

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
    <Dialog.Base open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        className={cn(
          `
            group/button inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)]
            transition-colors hover:bg-muted
          `,
          className,
        )}
        aria-label={t('incomes.create.open', { currency })}
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
            <BudgetLabel />
            <Dialog.Title>{t('incomes.create.title')}</Dialog.Title>

            <div className="flex gap-2.5">
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
              <button
                type="button"
                className={cn(
                  `
                  inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground
                  transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50
                `,
                )}
                onClick={() => handleOpenChange(false)}
                aria-label={t('incomes.create.close')}
                disabled={createIncomeMutation.isPending}
              >
                <LucideX className="size-4" />
              </button>
            </div>
          </Dialog.Header>

          <Dialog.Body>
            <Dialog.Description>{t('incomes.create.currency', { currency })}</Dialog.Description>
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
                      isLoading={accountsQuery.isLoading || userQuery.isLoading}
                      error={accountsQuery.isError || userQuery.isError
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

            <form.Field name="source">
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
                      placeholder={scope.kind === 'group'
                        ? 'Описание дохода (необязательно)' : t('incomes.create.fields.name')}
                      hasError={Boolean(fieldError)}
                      disabled={createIncomeMutation.isPending}
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
                const precisionError = amountPrecisionInvalid
                  ? t('incomes.create.validation.precision', {
                    currency: selectedAccount?.currency,
                  })
                  : undefined;
                const error = fieldError ?? precisionError;

                return (
                  <div>
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
                  <>
                    <Input.Base
                      id="create-income-date"
                      name={field.name}
                      type="date"
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
