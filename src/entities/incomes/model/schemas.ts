import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionSchema,
  transactionsRevenueSchema,
} from '@/entities/transactions/@x/incomes';
import { z } from 'zod';
import { entityMetaSchema, paginatedResponseSchema } from '@/shared/api';

export const incomeSchema = z
  .object({
    source: z.string().max(255).optional(),
  })
  .extend(transactionSchema.shape)
  .extend(entityMetaSchema.shape);

export const createIncomeSchema = z.object({
  source: z.string().max(255).optional(),
}).extend(createTransactionSchema.shape);

export const updateIncomeSchema = createIncomeSchema
  .omit({ accountId: true, transactionDate: true })
  .partial();

export const listIncomesQuerySchema = listTransactionsQuerySchema;

export const incomeRevenueSchema = transactionsRevenueSchema;

export const incomesPaginatedResponseSchema = paginatedResponseSchema(incomeSchema);

export type Income = z.infer<typeof incomeSchema>;
export type IncomeRevenue = z.infer<typeof incomeRevenueSchema>;
export type CreateIncomeDto = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeDto = z.infer<typeof updateIncomeSchema>;
export type ListIncomesQuery = z.infer<typeof listIncomesQuerySchema>;
export type IncomesPaginatedResponse = z.infer<typeof incomesPaginatedResponseSchema>;
