import { z } from 'zod';
import type { Plan } from '@/entities/plans';

export const executePlanFormSchema = z.object({
  participantId: z.string(),
  accountId: z.string().trim().min(1, 'required'),
  closingDate: z.string().trim().min(1, 'required'),
  amount: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => Number.isFinite(Number(value)), 'invalid')
    .refine((value) => Number(value) > 0, 'min'),
  description: z
    .string()
    .trim()
    .min(1, 'required')
    .max(500, 'descriptionTooLong'),
});

export type ExecutePlanFormValues = z.infer<typeof executePlanFormSchema>;

export const todayDateInputValue = () => new Date().toISOString().slice(0, 10);

interface PlanAccount {
  _id: string;
  type: 'balance' | 'saving';
  currency: Plan['currency'];
  archivedAt: string | null;
}

export const getEligiblePlanAccounts = <T extends PlanAccount>(accounts: T[], currency: Plan['currency']) => (
  accounts.filter((account) => account.archivedAt === null && account.currency === currency)
);

export const getExecutePlanFormValues = (plan: Plan, accounts: PlanAccount[] = []): ExecutePlanFormValues => {
  const eligible = getEligiblePlanAccounts(accounts, plan.currency);
  return {
    accountId: (eligible.find((account) => account.type === 'balance') ?? eligible[0])?._id ?? '',
    participantId: '',
    closingDate: todayDateInputValue(),
    amount: String(plan.amount),
    description: plan.description,
  };
};
