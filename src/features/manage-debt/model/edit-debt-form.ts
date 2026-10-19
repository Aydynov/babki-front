import { z } from 'zod';
import type { Debt } from '@/entities/debts';

export const editDebtFormSchema = z.object({
  debtor: z.string().trim().min(1, 'required').max(150, 'tooLong'),
  description: z.string().trim().max(150, 'debtDescriptionTooLong'),
  dueDate: z.string().trim(),
  principalAmount: z.string(),
});

export type EditDebtFormValues = z.infer<typeof editDebtFormSchema>;

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return '';

  return new Date(value).toISOString().slice(0, 10);
};

export const getEditDebtFormValues = (debt: Debt): EditDebtFormValues => ({
  debtor: debt.debtor,
  principalAmount: String(debt.principalAmount),
  description: debt.description ?? '',
  dueDate: toDateInputValue(debt.dueDate),
});
