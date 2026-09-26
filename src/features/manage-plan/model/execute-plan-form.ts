import { z } from 'zod';
import type { Plan } from '@/entities/plans';

export const executePlanFormSchema = z.object({
  accountId: z.string().trim().min(1, 'required'),
  closingDate: z.string().trim().min(1, 'required'),
  amount: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => !Number.isNaN(Number(value)), 'invalid')
    .refine((value) => Number(value) >= 0.01, 'min'),
  description: z
    .string()
    .trim()
    .min(1, 'required')
    .max(500, 'descriptionTooLong'),
});

export type ExecutePlanFormValues = z.infer<typeof executePlanFormSchema>;

export const todayDateInputValue = () => new Date().toISOString().slice(0, 10);

export const getExecutePlanFormValues = (plan: Plan): ExecutePlanFormValues => ({
  accountId: '',
  closingDate: todayDateInputValue(),
  amount: String(plan.amount),
  description: plan.description,
});

interface PlanAccount {
  _id: string;
  currency: Plan['currency'];
  archivedAt: string | null;
}

export const getEligiblePlanAccounts = <T extends PlanAccount>(accounts: T[], currency: Plan['currency']) => (
  accounts.filter((account) => account.archivedAt === null && account.currency === currency)
);
