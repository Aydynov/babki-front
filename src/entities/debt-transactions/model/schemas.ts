import { z } from 'zod';
import {
  dateStringSchema,
  financialActorSchema,
  objectIdSchema,
  entityMetaSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from '@/shared/api';

export const debtTransactionSchema = z
  .object({
    spaceId: objectIdSchema,
    createdBy: objectIdSchema,
    createdByActor: financialActorSchema,
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
    debtId: objectIdSchema,
    isIncome: z.boolean(),
    incomeId: objectIdSchema.optional(),
    cancelledAt: dateStringSchema.nullable(),
    cancelledBy: objectIdSchema.optional(),
    cancelledByActor: financialActorSchema.optional(),
    amount: z.number().positive(),
    transactionDate: dateStringSchema,
    description: z.string().optional(),
  })
  .extend({ ...entityMetaSchema.shape, spaceId: objectIdSchema });

export const listDebtTransactionsQuerySchema = paginationQuerySchema;

export const debtTransactionsPaginatedResponseSchema = paginatedResponseSchema(
  debtTransactionSchema,
);

export type DebtTransaction = z.infer<typeof debtTransactionSchema>;
export type ListDebtTransactionsQuery = z.infer<
  typeof listDebtTransactionsQuerySchema
>;
export type DebtTransactionsPaginatedResponse = z.infer<
  typeof debtTransactionsPaginatedResponseSchema
>;
