import {
  AccountSelect,
  accountsQueryOptions,
} from '@/entities/accounts';
import {
  CategorySelect,
  type ExpenseCategory,
  expenseCategoriesQueryOptions,
} from '@/entities/expense-categories';
import { usersQueryOptions } from '@/entities/users';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import {
  getCurrencyMinorUnits,
  hasValidMoneyPrecision,
  type CurrencyCode,
} from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import {
  LucideCheck,
  LucidePlus,
  LucideX,
} from 'lucide-react';
import type {
  FC,
  RefObject,
} from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyAmountInput,
  calculateExpenseItemsTotal,
  changeExpenseItemQuantity,
  createExpenseItemDraft,
  type ExpenseFormValues,
  expenseCategoryFieldValidators,
  expenseFieldSchemas,
  expenseFormValidationOptions,
  getExpenseCategoryOptions,
  getExpenseAccountContext,
  getExpenseDescriptionValidationError,
  getExpenseInitialAccountId,
  getExpenseValidationKey,
  hasValidExpenseMoneyPrecision,
  isExpenseItemValid,
} from '../model/expense-form';
import { ExpenseItemRow } from './expense-item-row';

interface ExpenseFormProps {
  defaultValues: ExpenseFormValues;
  initialAmountOverridden: boolean;
  currentCategory?: ExpenseCategory;
  dateDisabled?: boolean;
  immutableCurrency?: CurrencyCode;
  pending: boolean;
  submitError?: string;
  title: string;
  saveLabel: string;
  savingLabel: string;
  closeLabel: string;
  idPrefix: string;
  finalFocus?: RefObject<HTMLButtonElement | null>;
  onClearSubmitError: () => void;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

const getValidationMessage = (error: string | undefined) => {
  const key = getExpenseValidationKey(error);
  return key ? i18next.t(key) : undefined;
};

export const ExpenseForm: FC<ExpenseFormProps> = ({
  defaultValues,
  initialAmountOverridden,
  currentCategory,
  dateDisabled = false,
  immutableCurrency,
  pending,
  submitError,
  title,
  saveLabel,
  savingLabel,
  closeLabel,
  idPrefix,
  finalFocus,
  onClearSubmitError,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const userQuery = useQuery(usersQueryOptions.me());
  const [amountOverridden, setAmountOverridden] = useState(initialAmountOverridden);
  const categories = getExpenseCategoryOptions(categoriesQuery.data ?? [], currentCategory);
  const currentCategoryUnavailable = categoriesQuery.isSuccess
    && Boolean(defaultValues.categoryId)
    && !categories.some(({ _id }) => _id === defaultValues.categoryId);
  const categoriesUnavailable = categoriesQuery.isLoading
    || categories.length === 0
    || currentCategoryUnavailable;
  const accountEditable = !dateDisabled;

  const form = useForm({
    defaultValues,
    ...expenseFormValidationOptions,
    listeners: {
      onChange: onClearSubmitError,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch {
        // The mutation retains the error while all form values stay available for retry.
      }
    },
  });

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const selectedAccount = getExpenseAccountContext(
    accounts,
    form.state.values.accountId,
  );
  const selectedCurrency = immutableCurrency ?? selectedAccount?.currency;
  const moneyStep = selectedCurrency
    ? String(1 / (10 ** getCurrencyMinorUnits(selectedCurrency)))
    : '0.01';
  const moneyPrecisionInvalid = selectedCurrency !== undefined
    && !hasValidExpenseMoneyPrecision(form.state.values, selectedCurrency);
  const accountsUnavailable = accountEditable && (
    accountsQuery.isLoading
    || userQuery.isLoading
    || accounts.every(({ archivedAt }) => archivedAt !== null)
  );

  useEffect(() => {
    if (
      !accountEditable
      || form.state.values.accountId
      || !accountsQuery.isSuccess
      || !userQuery.isSuccess
    ) return;

    const accountId = getExpenseInitialAccountId(
      accounts,
      userQuery.data?.defaultAccountId ?? null,
    );
    if (accountId) form.setFieldValue('accountId', accountId);
  }, [
    accountEditable,
    accounts,
    accountsQuery.isSuccess,
    form,
    userQuery.data,
    userQuery.isSuccess,
  ]);

  const syncAutomaticAmount = (
    items: ReturnType<typeof form.getFieldValue<'items'>>,
  ) => {
    if (!amountOverridden) {
      form.setFieldValue('amount', calculateExpenseItemsTotal(items));
    }
  };

  const updateItem = (
    index: number,
    field: 'name' | 'quantity' | 'price',
    value: string,
  ) => {
    const items = form.getFieldValue('items');
    const nextItems = items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    ));
    form.setFieldValue(`items[${index}].${field}`, value);
    syncAutomaticAmount(nextItems);
  };

  const addItem = () => {
    const nextItems = [...form.getFieldValue('items'), createExpenseItemDraft()];
    form.pushFieldValue('items', nextItems[nextItems.length - 1]);
    syncAutomaticAmount(nextItems);
  };

  const removeItem = (index: number) => {
    const nextItems = form.getFieldValue('items').filter((_, itemIndex) => itemIndex !== index);
    form.removeFieldValue('items', index);
    syncAutomaticAmount(nextItems);
  };

  return (
    <Dialog.Content
      className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden"
      finalFocus={finalFocus}
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <Dialog.Header className="shrink-0">
          <Dialog.Title>{title}</Dialog.Title>
          <div className="flex gap-2.5">
            <Button.Base
              type="submit"
              disabled={pending || categoriesUnavailable || accountsUnavailable || moneyPrecisionInvalid}
            >
              <LucideCheck />
              {pending
                ? savingLabel
                : saveLabel}
            </Button.Base>
            <Button.Icon
              type="button"
              onClick={() => onClose()}
              aria-label={closeLabel}
              disabled={pending}
            >
              <LucideX />
            </Button.Icon>
          </div>
        </Dialog.Header>

        <Dialog.Body className="min-h-0 overflow-y-auto pr-1">
          {accountEditable ? (
            <form.Field
              name="accountId"
              validators={{ onSubmit: expenseFieldSchemas.accountId }}
            >
              {(field) => {
                const error = getValidationMessage(getFirstFieldError(field.state.meta.errors));

                return (
                  <div>
                    <AccountSelect
                      id={`${idPrefix}-account`}
                      accounts={accounts}
                      value={field.state.value}
                      onValueChange={(value) => {
                        onClearSubmitError();
                        field.handleChange(value);
                      }}
                      label={t('expenses.create.fields.account')}
                      placeholder={t('expenses.create.accounts.placeholder')}
                      emptyMessage={t('expenses.create.accounts.empty')}
                      isLoading={accountsQuery.isLoading || userQuery.isLoading}
                      error={accountsQuery.isError || userQuery.isError
                        ? t('expenses.create.accounts.error')
                        : undefined}
                      disabled={pending}
                      offerAccountCreation
                    />
                    {error && <Input.Error>{error}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-3">
              <Typography.Body2>{t('expenses.edit.accountContext')}</Typography.Body2>
              <Typography.Caption1 className="text-muted-foreground">
                {selectedAccount?.name ?? defaultValues.accountId}
                {' · '}
                {immutableCurrency}
                {selectedAccount?.archivedAt ? ` · ${t('expenses.edit.accountArchived')}` : ''}
              </Typography.Caption1>
            </div>
          )}

          <form.Field
            name="categoryId"
            validators={expenseCategoryFieldValidators}
          >
            {(field) => {
              const error = getValidationMessage(getFirstFieldError(field.state.meta.errors));

              return (
                <div>
                  <Input.Label>{t('expenses.create.fields.category')}</Input.Label>
                  <CategorySelect
                    options={categories}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    onBlur={field.handleBlur}
                    placeholder={t('expenses.create.fields.category')}
                    disabled={pending || categoriesUnavailable}
                    hasError={Boolean(error)}
                  />
                  {error && <Input.Error>{error}</Input.Error>}
                  {categoriesQuery.isLoading && (
                    <Typography.Caption1 className="mt-2 text-muted-foreground" aria-live="polite">
                      {t('expenses.create.categories.loading')}
                    </Typography.Caption1>
                  )}
                  {categoriesQuery.isError && categoriesQuery.data === undefined && (
                    <div className="mt-2 flex items-center justify-between gap-3" role="alert">
                      <Typography.Caption1 className="text-destructive">
                        {t('expenses.create.categories.error')}
                      </Typography.Caption1>
                      <Button.Base
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => categoriesQuery.refetch()}
                        disabled={categoriesQuery.isFetching || pending}
                      >
                        {t('expenses.create.categories.retry')}
                      </Button.Base>
                    </div>
                  )}
                  {categoriesQuery.isSuccess && categories.length === 0 && (
                    <Typography.Caption1 className="mt-2 text-muted-foreground">
                      {t('expenses.create.categories.empty')}
                    </Typography.Caption1>
                  )}
                  {currentCategoryUnavailable && (
                    <Typography.Caption1 className="mt-2 text-destructive" role="alert">
                      {t('expenses.edit.categories.currentUnavailable')}
                    </Typography.Caption1>
                  )}
                </div>
              );
            }}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="amount"
              validators={{ onBlur: expenseFieldSchemas.amount }}
            >
              {(field) => {
                const validationError = getValidationMessage(getFirstFieldError(field.state.meta.errors));
                const precisionError = selectedCurrency
                  && Number.isFinite(Number(field.state.value))
                  && !hasValidMoneyPrecision(Number(field.state.value), selectedCurrency)
                  ? t('expenses.create.validation.precision', { currency: selectedCurrency })
                  : undefined;
                const error = validationError ?? precisionError;

                return (
                  <div>
                    <Input.Label htmlFor={`${idPrefix}-amount`}>
                      {t('expenses.create.fields.amount')}
                    </Input.Label>
                    <Input.Base
                      id={`${idPrefix}-amount`}
                      name={field.name}
                      type="number"
                      inputMode="decimal"
                      step={moneyStep}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        onClearSubmitError();
                        const next = applyAmountInput(
                          event.target.value,
                          form.getFieldValue('items'),
                        );
                        setAmountOverridden(next.amountOverridden);
                        field.handleChange(next.amount);
                      }}
                      placeholder="0.00"
                      hasError={Boolean(error)}
                      disabled={pending}
                    />
                    {error && <Input.Error>{error}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="transactionDate"
              validators={{ onBlur: expenseFieldSchemas.transactionDate }}
            >
              {(field) => {
                const error = getValidationMessage(getFirstFieldError(field.state.meta.errors));

                return (
                  <div>
                    <Input.Label htmlFor={`${idPrefix}-date`}>
                      {t('expenses.create.fields.date')}
                    </Input.Label>
                    <Input.Base
                      id={`${idPrefix}-date`}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        onClearSubmitError();
                        field.handleChange(event.target.value);
                      }}
                      hasError={Boolean(error)}
                      disabled={pending || dateDisabled}
                    />
                    {error && <Input.Error>{error}</Input.Error>}
                  </div>
                );
              }}
            </form.Field>
          </div>

          <form.Field
            name="merchant"
            validators={{ onBlur: expenseFieldSchemas.merchant }}
          >
            {(field) => {
              const error = getValidationMessage(getFirstFieldError(field.state.meta.errors));

              return (
                <div>
                  <Input.Label htmlFor={`${idPrefix}-merchant`}>
                    {t('expenses.create.fields.merchant')}
                  </Input.Label>
                  <Input.Base
                    id={`${idPrefix}-merchant`}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      onClearSubmitError();
                      field.handleChange(event.target.value);
                    }}
                    placeholder={t('expenses.create.fields.merchantPlaceholder')}
                    hasError={Boolean(error)}
                    disabled={pending}
                  />
                  {error && <Input.Error>{error}</Input.Error>}
                </div>
              );
            }}
          </form.Field>

          <form.Field
            name="description"
            validators={{
              onBlur: ({ value }) => getExpenseDescriptionValidationError(
                value,
                form.getFieldValue('items'),
              ),
            }}
          >
            {(field) => {
              const error = getValidationMessage(getFirstFieldError(field.state.meta.errors));

              return (
                <div>
                  <Input.Label htmlFor={`${idPrefix}-description`}>
                    {t('expenses.create.fields.description')}
                  </Input.Label>
                  <Input.Base
                    id={`${idPrefix}-description`}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      onClearSubmitError();
                      field.handleChange(event.target.value);
                    }}
                    placeholder={t('expenses.create.fields.descriptionPlaceholder')}
                    hasError={Boolean(error)}
                    disabled={pending}
                  />
                  {error && <Input.Error>{error}</Input.Error>}
                </div>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.items}>
            {(items) => {
              const lastItem = items.at(-1);
              const addDisabled = pending
                || (lastItem !== undefined && !isExpenseItemValid(lastItem));

              return (
                <div className="flex flex-col gap-3">
                  {items.map((item, index) => (
                    <form.Field
                      key={`${item.id}-name`}
                      name={`items[${index}].name`}
                      validators={{ onBlur: expenseFieldSchemas.itemName }}
                    >
                      {(nameField) => (
                        <form.Field
                          name={`items[${index}].quantity`}
                          validators={{ onBlur: expenseFieldSchemas.itemQuantity }}
                        >
                          {(quantityField) => (
                            <form.Field
                              name={`items[${index}].price`}
                              validators={{ onBlur: expenseFieldSchemas.itemPrice }}
                            >
                              {(priceField) => (
                                <ExpenseItemRow
                                  item={item}
                                  index={index}
                                  disabled={pending}
                                  errors={{
                                    name: getValidationMessage(
                                      getFirstFieldError(nameField.state.meta.errors),
                                    ),
                                    quantity: getValidationMessage(
                                      getFirstFieldError(quantityField.state.meta.errors),
                                    ),
                                    price: getValidationMessage(
                                      getFirstFieldError(priceField.state.meta.errors),
                                    ) ?? (selectedCurrency
                                      && Number.isFinite(Number(priceField.state.value))
                                      && !hasValidMoneyPrecision(
                                        Number(priceField.state.value),
                                        selectedCurrency,
                                      )
                                      ? t('expenses.create.validation.precision', {
                                        currency: selectedCurrency,
                                      })
                                      : undefined),
                                  }}
                                  moneyStep={moneyStep}
                                  onNameChange={(value) => updateItem(index, 'name', value)}
                                  onNameBlur={nameField.handleBlur}
                                  onQuantityChange={(value) => updateItem(index, 'quantity', value)}
                                  onQuantityBlur={quantityField.handleBlur}
                                  onPriceChange={(value) => updateItem(index, 'price', value)}
                                  onPriceBlur={priceField.handleBlur}
                                  onIncrement={() => updateItem(
                                    index,
                                    'quantity',
                                    changeExpenseItemQuantity(item.quantity, 1),
                                  )}
                                  onDecrement={() => updateItem(
                                    index,
                                    'quantity',
                                    changeExpenseItemQuantity(item.quantity, -1),
                                  )}
                                  onRemove={() => removeItem(index)}
                                />
                              )}
                            </form.Field>
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                  ))}

                  <Button.Base
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addItem}
                    disabled={addDisabled}
                  >
                    <LucidePlus />
                    {items.length === 0
                      ? t('expenses.create.items.start')
                      : t('expenses.create.items.addMore')}
                  </Button.Base>
                </div>
              );
            }}
          </form.Subscribe>

          {submitError && (
            <Typography.Caption1 className="text-destructive" role="alert">
              {submitError}
            </Typography.Caption1>
          )}
        </Dialog.Body>
      </form>
    </Dialog.Content>
  );
};
