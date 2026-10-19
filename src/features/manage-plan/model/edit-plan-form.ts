import { z } from 'zod';
import type { Plan } from '@/entities/plans';

export const editPlanFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'required')
    .max(500, 'descriptionTooLong'),
  categoryId: z.string().trim().min(1, 'required'),
  amount: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => Number.isFinite(Number(value)), 'invalid')
    .refine((value) => Number(value) > 0, 'min'),
  targetDate: z.string().trim().min(1, 'required'),
});

export type EditPlanFormValues = z.infer<typeof editPlanFormSchema>;

const toDateInputValue = (value: string) => new Date(value).toISOString().slice(0, 10);

export const getEditPlanFormValues = (plan: Plan): EditPlanFormValues => ({
  description: plan.description,
  categoryId: plan.categoryId,
  amount: String(plan.amount),
  targetDate: toDateInputValue(plan.targetDate),
});
