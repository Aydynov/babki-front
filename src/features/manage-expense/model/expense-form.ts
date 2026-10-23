import type { ExpenseCategory } from '@/entities/expense-categories';
import type { Account } from '@/entities/accounts';
import type { CreateExpenseDto, Expense, UpdateExpenseDto } from '@/entities/expenses';
import { z } from 'zod';
import type { CurrencyCode } from '@/shared/lib/currency';
// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '../../../shared/lib/currency/index.ts';

export interface ExpenseItemDraft {
  id: string;
  name: string;
  quantity: string;
  price: string;
}

export interface ExpenseFormValues {
  participantId?: string;
  originalParticipantId?: string;
  accountId: string;
  categoryId: string;
  amount: string;
  transactionDate: string;
  merchant: string;
  description: string;
  items: ExpenseItemDraft[];
}

interface AmountInputResult {
  amount: string;
  amountOverridden: boolean;
}

const positiveNumberStringSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .refine((value) => Number.isFinite(Number(value)), 'invalid')
  .refine((value) => Number(value) > 0, 'positive');

const integerQuantityStringSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .refine((value) => Number.isInteger(Number(value)), 'integer')
  .refine((value) => Number(value) >= 1, 'quantityMin');

export const expenseFieldSchemas = {
  accountId: z.string().trim().min(1, 'required'),
  categoryId: z.string().trim().min(1, 'required'),
  amount: positiveNumberStringSchema,
  transactionDate: z.string().trim().min(1, 'required').pipe(z.iso.date('dateInvalid')),
  merchant: z.string().max(255, 'merchantTooLong'),
  description: z.string().max(1000, 'descriptionTooLong'),
  itemName: z.string().trim().min(1, 'required'),
  itemQuantity: integerQuantityStringSchema,
  itemPrice: positiveNumberStringSchema,
} as const;

export const expenseCategoryFieldValidators = {
  onSubmit: expenseFieldSchemas.categoryId,
} as const;

export const getExpenseDescriptionValidationError = (
  description: string,
  items: ExpenseItemDraft[],
) => {
  const result = expenseFieldSchemas.description.safeParse(description);
  if (!result.success) return result.error.issues[0]?.message;

  return !description.trim() && items.length === 0 ? 'contentRequired' : undefined;
};

export const expenseItemDraftSchema = z.object({
  id: z.string(),
  name: expenseFieldSchemas.itemName,
  quantity: expenseFieldSchemas.itemQuantity,
  price: expenseFieldSchemas.itemPrice,
});

export const expenseFormSchema = z
  .object({
    accountId: expenseFieldSchemas.accountId,
    categoryId: expenseFieldSchemas.categoryId,
    amount: expenseFieldSchemas.amount,
    transactionDate: expenseFieldSchemas.transactionDate,
    merchant: expenseFieldSchemas.merchant,
    description: expenseFieldSchemas.description,
    items: z.array(expenseItemDraftSchema),
  })
  .superRefine((value, context) => {
    if (value.description.trim() || value.items.length > 0) return;

    context.addIssue({
      code: 'custom',
      message: 'contentRequired',
      path: ['description'],
    });
  });

export const expenseFormValidationOptions = {
  canSubmitWhenInvalid: true,
  validators: {
    onSubmit: expenseFormSchema,
  },
} as const;

const padDatePart = (value: number) => String(value).padStart(2, '0');

export const formatLocalDate = (date: Date) => [
  date.getFullYear(),
  padDatePart(date.getMonth() + 1),
  padDatePart(date.getDate()),
].join('-');

export const getDefaultExpenseAccountId = (
  accounts: Pick<Account, '_id' | 'type' | 'archivedAt'>[],
) => accounts.find((account) => account.type === 'balance' && account.archivedAt === null)?._id ?? '';

export const getDefaultExpenseFormValues = (
  date = new Date(),
  accountId = '',
): ExpenseFormValues => ({
  accountId,
  participantId: '',
  categoryId: '',
  amount: '',
  transactionDate: formatLocalDate(date),
  merchant: '',
  description: '',
  items: [],
});

export const getEditExpenseFormValues = (
  expense: Expense,
): ExpenseFormValues => ({
  accountId: expense.accountId,
  participantId: expense.participantId,
  originalParticipantId: expense.participantId,
  categoryId: expense.category._id,
  amount: String(expense.amount),
  transactionDate: expense.transactionDate.slice(0, 10),
  merchant: expense.merchant ?? '',
  description: expense.description ?? '',
  items: expense.items.map(({ name, quantity, price }) => ({
    id: crypto.randomUUID(),
    name,
    quantity: String(quantity),
    price: String(price),
  })),
});

export const getExpenseCategoryOptions = (
  categories: ExpenseCategory[],
  currentCategory?: ExpenseCategory,
) => {
  const activeCategories = categories.filter(({ isArchived }) => !isArchived);

  return currentCategory
    && !activeCategories.some(({ _id }) => _id === currentCategory._id)
    ? [currentCategory, ...activeCategories]
    : activeCategories;
};

type ExpenseAccount = Pick<Account, '_id' | 'name' | 'archivedAt' | 'currency'>;

export const getExpenseAccountContext = (
  accounts: ExpenseAccount[],
  accountId: string,
) => accounts.find(({ _id }) => _id === accountId) ?? null;

export const hasValidExpenseMoneyPrecision = (
  values: Pick<ExpenseFormValues, 'amount' | 'items'>,
  currency: CurrencyCode,
) => (
  hasValidMoneyPrecision(Number(values.amount), currency)
  && values.items.every(({ price }) => hasValidMoneyPrecision(Number(price), currency))
);

export const createExpenseItemDraft = (): ExpenseItemDraft => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: '1',
  price: '',
});

export const isExpenseItemValid = (item: ExpenseItemDraft) => (
  expenseItemDraftSchema.safeParse(item).success
);

export const changeExpenseItemQuantity = (
  quantity: string,
  change: -1 | 1,
) => {
  const parsedQuantity = Number(quantity);
  const currentQuantity = Number.isInteger(parsedQuantity) && parsedQuantity >= 1
    ? parsedQuantity
    : 1;

  return String(Math.max(1, currentQuantity + change));
};

export const calculateExpenseItemsTotal = (items: ExpenseItemDraft[], currency: CurrencyCode = 'RUB') => {
  const factor = 10 ** getCurrencyMinorUnits(currency);
  const amountInMinorUnits = items.reduce((total, item) => {
    const price = Number(item.price);

    if (!Number.isFinite(price) || price <= 0) {
      return total;
    }

    const priceInMinorUnits = Math.round((price + Number.EPSILON) * factor);
    return total + priceInMinorUnits;
  }, 0);

  return amountInMinorUnits > 0 ? String(amountInMinorUnits / factor) : '';
};

const toMinorUnits = (value: string, currency: CurrencyCode) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue)
    ? Math.round((parsedValue + Number.EPSILON) * (10 ** getCurrencyMinorUnits(currency)))
    : 0;
};

export const isExpenseAmountOverridden = (
  amount: string,
  items: ExpenseItemDraft[],
  currency: CurrencyCode = 'RUB',
) => toMinorUnits(amount, currency) !== toMinorUnits(calculateExpenseItemsTotal(items, currency), currency);

export const applyAmountInput = (
  amount: string,
  items: ExpenseItemDraft[],
  currency: CurrencyCode = 'RUB',
): AmountInputResult => {
  if (!amount.trim() || Number(amount) === 0) {
    return {
      amount: calculateExpenseItemsTotal(items, currency),
      amountOverridden: false,
    };
  }

  return { amount, amountOverridden: true };
};

export const mapCreateExpenseDto = (
  values: ExpenseFormValues,
): CreateExpenseDto => ({
  accountId: values.accountId.trim(),
  ...(values.participantId ? { participantId: values.participantId } : {}),
  categoryId: values.categoryId.trim(),
  amount: Number(values.amount),
  transactionDate: values.transactionDate,
  merchant: values.merchant.trim() || undefined,
  description: values.description.trim() || undefined,
  items: values.items.length > 0
    ? values.items.map(({ name, quantity, price }) => ({
      name: name.trim(),
      quantity: Number(quantity),
      price: Number(price),
    }))
    : undefined,
});

export const mapUpdateExpenseDto = (
  values: ExpenseFormValues,
): UpdateExpenseDto => ({
  ...(values.participantId && values.participantId !== values.originalParticipantId
    ? { participantId: values.participantId } : {}),
  categoryId: values.categoryId.trim(),
  amount: Number(values.amount),
  merchant: values.merchant.trim(),
  description: values.description.trim(),
  items: values.items.map(({ name, quantity, price }) => ({
    name: name.trim(),
    quantity: Number(quantity),
    price: Number(price),
  })),
});

export const expenseValidationKeys = {
  required: 'validation.required',
  invalid: 'expenses.create.validation.numberInvalid',
  positive: 'expenses.create.validation.positive',
  integer: 'expenses.create.validation.integer',
  quantityMin: 'expenses.create.validation.quantityMin',
  dateInvalid: 'expenses.create.validation.dateInvalid',
  merchantTooLong: 'expenses.create.validation.merchantTooLong',
  descriptionTooLong: 'expenses.create.validation.descriptionTooLong',
  contentRequired: 'expenses.create.validation.contentRequired',
} as const;

export const getExpenseValidationKey = (code: string | undefined) => (
  code && code in expenseValidationKeys
    ? expenseValidationKeys[code as keyof typeof expenseValidationKeys]
    : undefined
);
