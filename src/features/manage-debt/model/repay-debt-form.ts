import { z } from 'zod';
import type { Debt } from '@/entities/debts';

export const getRepayDebtFormSchema = (remainingAmount: number) => z.object({
  accountId: z.string(),
  repaymentDate: z.string().trim().min(1, 'required'),
  amount: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => !Number.isNaN(Number(value)), 'invalid')
    .refine((value) => Number(value) >= 0.01, 'min')
    .refine((value) => Number(value) <= remainingAmount, 'maxRepayment'),
  description: z
    .string()
    .trim()
    .max(1000, 'repaymentDescriptionTooLong'),
  isIncome: z.boolean(),
}).superRefine(({ accountId, isIncome }, context) => {
  if (isIncome && !accountId) {
    context.addIssue({ code: 'custom', message: 'required', path: ['accountId'] });
  }
});

export type RepayDebtFormValues = z.infer<ReturnType<typeof getRepayDebtFormSchema>>;

export const todayDateInputValue = () => new Date().toISOString().slice(0, 10);

export const getRepayDebtFormValues = (debt: Debt): RepayDebtFormValues => ({
  accountId: '',
  repaymentDate: todayDateInputValue(),
  amount: String(debt.remainingAmount),
  description: '',
  isIncome: true,
});

interface DebtRepaymentAccount {
  _id: string;
  currency: Debt['currency'];
  archivedAt: string | null;
}

export const getEligibleDebtRepaymentAccounts = <T extends DebtRepaymentAccount>(
  accounts: T[],
  currency: Debt['currency'],
) => accounts.filter((account) => account.archivedAt === null && account.currency === currency);
