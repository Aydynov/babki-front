import { z } from 'zod';
import type { ExpenseCategory } from '@/entities/expense-categories';
import { isCategoryColor } from './constants';

export type CategoryDraftFieldError = 'required' | 'tooLong' | 'duplicate' | 'invalidColor' | 'descriptionTooLong';

export const getCategoryFormSchema = (
  categories: Pick<ExpenseCategory, '_id' | 'name'>[],
  categoryId?: string,
) => z.object({
  name: z.string().trim().min(1, 'required').max(100, 'tooLong')
    .refine((name) => (
      !categories.some((category) => category._id !== categoryId
      && category.name.trim().toLowerCase() === name.toLowerCase())
    ), 'duplicate'),
  color: z.string().toUpperCase().min(1, 'required').refine(isCategoryColor, 'invalidColor'),
  description: z.string().max(500, 'descriptionTooLong'),
});
