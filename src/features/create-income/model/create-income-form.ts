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

export const getIncomeAccounts = <T extends IncomeAccount>(accounts: T[], currency?: CurrencyCode) => (
  accounts.filter((account) => (
    account.archivedAt === null && (currency === undefined || account.currency === currency)
  ))
);

export const createIncomeFormSchema = z
  .object({
    accountId: z.string().trim().min(1, 'required'),
    description: z.string().trim().max(1000, 'tooLong'),
    amount: z
      .string()
      .trim()
      .min(1, 'required')
      .refine((value) => !Number.isNaN(Number(value)), 'invalid')
      .refine((value) => Number(value) > 0, 'min'),
    transactionDate: z.string().min(1, 'required').pipe(z.iso.date('invalid')),
  });

export type CreateIncomeFormValues = z.infer<typeof createIncomeFormSchema>;

export const getDefaultCreateIncomeFormValues = (
  accounts: IncomeAccount[] = [],
  currency?: CurrencyCode,
): CreateIncomeFormValues => ({
  accountId: getIncomeAccounts(accounts, currency).find((account) => account.type === 'balance')?._id ?? '',
  description: '',
  amount: '',
  transactionDate: '',
});

export const defaultCreateIncomeFormValues = getDefaultCreateIncomeFormValues();

export const hasValidIncomeAmountPrecision = (
  amount: string,
  currency: CurrencyCode,
) => hasValidMoneyPrecision(Number(amount), currency);

export const mapCreateIncomeDto = (
  values: CreateIncomeFormValues,
): CreateIncomeDto => ({
  accountId: values.accountId.trim(),
  description: values.description.trim() || undefined,
  amount: Number(values.amount),
  transactionDate: values.transactionDate,
});
