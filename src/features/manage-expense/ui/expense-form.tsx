import { useBudgetScope, useBudgetPermission } from '@/entities/budgets';
import { spacesQueryOptions } from '@/entities/spaces';
import { actorLabel } from '@/shared/lib/actor-label';
import {
  AccountSelect,
  useAccountsQueryOptions,
} from '@/entities/accounts';
import {
  CategorySelect,
  type ExpenseCategory,
  useExpenseCategoriesQueryOptions,
} from '@/entities/expense-categories';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import {
  getCurrencyMinorUnits,
  hasValidMoneyPrecision,
  type CurrencyCode,
} from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Typography } from '@/shared/ui/typography';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import {
  LucideArrowLeft,
  LucideCheck,
  LucidePlus,
} from 'lucide-react';
import type {
  FC,
  RefObject,
} from 'react';
import {
  Fragment, useMemo, useRef, useState,
} from 'react';
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
  getExpenseValidationKey,
  hasValidExpenseMoneyPrecision,
  isExpenseItemValid,
} from '../model/expense-form';
import { ExpenseItemRow } from './expense-item-row';

interface ExpenseFormProps {
  embedded?: boolean;
  defaultValues: ExpenseFormValues;
  initialAmountOverridden: boolean;
  currentCategory?: ExpenseCategory;
  dateDisabled?: boolean;
  canAssignParticipant?: boolean;
  participantActor?: { userId: string; firstName: string | null; lastName: string | null; isAnonymized: boolean };
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
  onCancel?: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

const getValidationMessage = (error: string | undefined) => {
  const key = getExpenseValidationKey(error);
  return key ? i18next.t(key) : undefined;
};

export const ExpenseForm: FC<ExpenseFormProps> = ({
  embedded = false,
  defaultValues,
  initialAmountOverridden,
  currentCategory,
  dateDisabled = false,
  canAssignParticipant = true,
  participantActor,
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
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const canCreateAccount = useBudgetPermission('manageAccounts');
  const scope = useBudgetScope();
  const members = useQuery(spacesQueryOptions.allMembers(scope.userId, scope.spaceId));
  const historicalParticipantId = participantActor?.userId ?? defaultValues.participantId;
  const participantOptions = [
    { value: scope.userId, label: 'Вы (по умолчанию)' },
    ...(historicalParticipantId && historicalParticipantId !== scope.userId
      && !members.data?.some((member) => member.userId === historicalParticipantId)
      ? [{ value: historicalParticipantId, label: participantActor ? actorLabel(participantActor) : 'Участник' }]
      : []),
    ...(members.data ?? []).filter((member) => member.userId !== scope.userId).map((member) => ({
      value: member.userId,
      label: [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Участник',
    })),
  ];
  const participantReadOnly = members.isSuccess && participantOptions.length === 1;
  const expenseCategoriesQueryOptions = useExpenseCategoriesQueryOptions();
  const categoriesQuery = useQuery(expenseCategoriesQueryOptions.findAll());
  const accountsQueryOptions = useAccountsQueryOptions();
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const [amountOverridden, setAmountOverridden] = useState(initialAmountOverridden);
  const addedItemId = useRef<string | null>(null);
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

    || accounts.every(({ archivedAt }) => archivedAt !== null)
  );

  const syncAutomaticAmount = (
    items: ReturnType<typeof form.getFieldValue<'items'>>,
  ) => {
    if (!amountOverridden) {
      form.setFieldValue('amount', calculateExpenseItemsTotal(items, selectedCurrency));
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
    const item = createExpenseItemDraft();
    const nextItems = [...form.getFieldValue('items'), item];
    addedItemId.current = item.id;
    form.pushFieldValue('items', item);
    syncAutomaticAmount(nextItems);
  };

  const removeItem = (index: number) => {
    const nextItems = form.getFieldValue('items').filter((_, itemIndex) => itemIndex !== index);
    form.removeFieldValue('items', index);
    syncAutomaticAmount(nextItems);
  };

  const actions = (
    <div className="flex gap-2.5">
      {onCancel && (
      <Button.Icon
        type="button"
        disabled={pending}
        onClick={onCancel}
        aria-label={t('expenses.details.backToView')}
        title={t('expenses.details.backToView')}
      >
        <LucideArrowLeft />
      </Button.Icon>
      )}
      <Button.Base
        type="submit"
        disabled={pending || categoriesUnavailable || accountsUnavailable || moneyPrecisionInvalid}
      >
        <LucideCheck />
        {pending
          ? savingLabel
          : saveLabel}
      </Button.Base>
    </div>
  );

  const Content = embedded ? Fragment : ScrollDialog.Content;

  return (
    <Content
      {...(embedded ? {} : {
        finalFocus,
      })}
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <ScrollDialog.Layout
          title={title}
          closeLabel={closeLabel}
          onClose={onClose}
          closeDisabled={pending}
          actions={actions}
        >
          {canAssignParticipant && (
          <form.Field name="participantId">
            {(field) => (
              <div>
                <Input.Label htmlFor={`${idPrefix}-participant`}>Участник расхода</Input.Label>
                {participantReadOnly ? (
                  <Input.Base
                    id={`${idPrefix}-participant`}
                    value="Вы (по умолчанию)"
                    readOnly
                  />
                ) : (
                  <Select.Root
                    items={participantOptions}
                    value={field.state.value || scope.userId}
                    disabled={pending || members.isLoading || members.isError}
                    onValueChange={(value) => {
                      if (value !== null) field.handleChange(value);
                    }}
                  >
                    <Select.Trigger
                      id={`${idPrefix}-participant`}
                      size="form"
                      onBlur={field.handleBlur}
                    >
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {participantOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
                {members.isError && <Input.Error>Не удалось загрузить участников</Input.Error>}
              </div>
            )}
          </form.Field>
          )}
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
                      isLoading={accountsQuery.isLoading}
                      error={accountsQuery.isError
                        ? t('expenses.create.accounts.error')
                        : undefined}
                      disabled={pending}
                      offerAccountCreation={canCreateAccount}
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
                          selectedCurrency,
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
                  {items.length > 0 && (
                    <div className="divide-y rounded-lg border">
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
                                      onNameMount={(input) => {
                                        if (input && addedItemId.current === item.id) {
                                          addedItemId.current = null;
                                          input.focus();
                                        }
                                      }}
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
                    </div>
                  )}

                  <Button.Base
                    type="button"
                    variant="ghost"
                    className="self-start"
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
        </ScrollDialog.Layout>
      </form>
    </Content>
  );
};
