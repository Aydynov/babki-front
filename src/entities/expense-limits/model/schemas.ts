import { expenseCategorySchema } from '@/entities/expense-categories/@x/expense-limits';
import { z } from 'zod';
import {
  dateStringSchema,
  entityMetaSchema,
  objectIdSchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';

export const expenseLimitSchema = z
  .object({
    category: expenseCategorySchema,
    currency: currencyCodeSchema,
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    total: z.number().positive(),
    rest: z.number(),
  })
  .extend(entityMetaSchema.shape);

export const createExpenseLimitSchema = z.object({
  categoryId: objectIdSchema,
  currency: currencyCodeSchema,
  total: z.number().positive(),
}).extend(expenseLimitSchema.pick({
  startDate: true,
  endDate: true,
}).partial().shape);

export const updateExpenseLimitSchema = createExpenseLimitSchema.pick({
  total: true,
});

export const findExpenseLimitQuerySchema = z.object({
  periodDate: dateStringSchema,
  categoryId: objectIdSchema.optional(),
  currency: currencyCodeSchema.optional(),
});

export type ExpenseLimit = z.infer<typeof expenseLimitSchema>;
export type CreateExpenseLimitDto = z.infer<typeof createExpenseLimitSchema>;
export type UpdateExpenseLimitDto = z.infer<typeof updateExpenseLimitSchema>;
export type FindExpenseLimitQuery = z.infer<typeof findExpenseLimitQuerySchema>;
