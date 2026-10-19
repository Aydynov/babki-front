import { z } from 'zod';
import {
  dateStringSchema,
  objectIdSchema,
  entityMetaSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from '@/shared/api';

export const debtTransactionSchema = z
  .object({
    debtId: z.string(),
    amount: z.number().min(0.01),
    transactionDate: dateStringSchema,
    description: z.string().optional(),
  })
  .extend(entityMetaSchema.shape);

export const listDebtTransactionsQuerySchema = paginationQuerySchema;

export const debtTransactionsPaginatedResponseSchema = paginatedResponseSchema(
  debtTransactionSchema,
);

export type DebtTransaction = z.infer<typeof debtTransactionSchema>;
export type ListDebtTransactionsQuery = z.infer<typeof listDebtTransactionsQuerySchema>;
export type DebtTransactionsPaginatedResponse = z.infer<
  typeof debtTransactionsPaginatedResponseSchema
>;

const groupActorSchema = z.object({
  userId: objectIdSchema.nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  isAnonymized: z.boolean(),
});

const groupOwnershipSchema = z.object({
  _id: objectIdSchema,
  ownerType: z.literal('group'),
  ownerId: objectIdSchema,
  createdBy: objectIdSchema,
  createdByActor: groupActorSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export const groupRepaymentSchema = debtTransactionSchema.extend({
  ...groupOwnershipSchema.shape,
  debtId: objectIdSchema,
  amount: z.number().finite().positive(),
  isIncome: z.boolean(),
  incomeId: objectIdSchema.optional(),
  cancelledAt: dateStringSchema.nullable(),
  cancelledBy: objectIdSchema.optional(),
  cancelledByActor: groupActorSchema.optional(),
});
export const groupRepaymentsPaginatedResponseSchema = paginatedResponseSchema(groupRepaymentSchema);
export type GroupRepayment = z.infer<typeof groupRepaymentSchema>;
