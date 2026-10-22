import { z } from 'zod';
import { dateStringSchema, objectIdSchema } from '@/shared/api';

export const expenseCategorySchema = z
  .object({
    name: z.string().max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    isArchived: z.boolean(),
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
  })
  .extend({ _id: objectIdSchema, spaceId: objectIdSchema });

export const createExpenseCategorySchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema
  .partial()
  .extend({ isArchived: z.boolean().optional() });

export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type CreateExpenseCategoryDto = z.infer<
  typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryDto = z.infer<
  typeof updateExpenseCategorySchema
>;
