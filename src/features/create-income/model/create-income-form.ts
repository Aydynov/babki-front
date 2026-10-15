import type { CreateIncomeDto } from '@/entities/incomes';
import { z } from 'zod';
// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { hasValidMoneyPrecision, type CurrencyCode } from '../../../shared/lib/currency/index.ts';

interface IncomeAccount {
  _id: string;
  archivedAt: string | null;
  type: 'balance' | 'saving';
  currency: CurrencyCode;
}

export const getIncomeAccounts = <T extends IncomeAccount>(accounts: T[], currency: CurrencyCode) => (
  accounts.filter((account) => (
    account.archivedAt === null && account.type === 'balance' && account.currency === currency
  ))
);

export const createIncomeFormSchema = z
  .object({
    accountId: z.string().trim().min(1, 'required'),
    source: z.string().trim().min(1, 'required').max(255, 'tooLong'),
    amount: z
      .string()
      .trim()
      .min(1, 'required')
      .refine((value) => !Number.isNaN(Number(value)), 'invalid')
      .refine((value) => Number(value) >= 0.01, 'min'),
    transactionDate: z.string(),
  });

export type CreateIncomeFormValues = z.infer<typeof createIncomeFormSchema>;

export const getDefaultCreateIncomeFormValues = (): CreateIncomeFormValues => ({
  accountId: '',
  source: '',
  amount: '',
  transactionDate: '',
});

export const defaultCreateIncomeFormValues = getDefaultCreateIncomeFormValues();

export const getIncomeInitialAccountId = (
  accounts: IncomeAccount[],
  defaultAccountId: string | null,
) => accounts.find(({ _id, archivedAt }) => (
  _id === defaultAccountId && archivedAt === null
))?._id ?? '';

export const hasValidIncomeAmountPrecision = (
  amount: string,
  currency: CurrencyCode,
) => hasValidMoneyPrecision(Number(amount), currency);

export const mapCreateIncomeDto = (
  values: CreateIncomeFormValues,
): CreateIncomeDto => ({
  accountId: values.accountId.trim(),
  source: values.source.trim(),
  amount: Number(values.amount),
  transactionDate: values.transactionDate,
});
