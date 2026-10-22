import { z } from 'zod';
import {
  dateStringSchema,
  financialActorSchema,
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
  periodQuerySchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';
import {
  effectiveRateSchema,
  transferEffectSchema,
} from '@/entities/transfers/@x/transactions';

export const transactionTypeEnum = z.enum(['income', 'expense', 'transfer']);

export const transactionBaseSchema = z
  .object({
    createdBy: objectIdSchema,
    participantId: objectIdSchema.optional(),
    createdByActor: financialActorSchema,
    participantActor: financialActorSchema.optional(),
    origin: z
      .object({ type: z.enum(['plan', 'debt']), id: objectIdSchema })
      .nullable()
      .optional(),
    transactionDate: dateStringSchema,
    description: z.string().max(1000).optional(),
  })
  .extend({ ...entityMetaSchema.shape, spaceId: objectIdSchema });

export const scalarTransactionSchema = transactionBaseSchema.extend({
  snapshotId: objectIdSchema.optional(),
  accountId: objectIdSchema,
  currency: currencyCodeSchema,
  amount: z.number().min(0),
  type: z.enum(['income', 'expense']),
});

export const incomeTransactionSchema = scalarTransactionSchema.extend({
  type: z.literal('income'),
});
export const expenseTransactionSchema = scalarTransactionSchema.extend({
  type: z.literal('expense'),
});
export const transferTransactionSchema = transactionBaseSchema.extend({
  type: z.literal('transfer'),
  source: transferEffectSchema,
  destination: transferEffectSchema,
  effectiveRate: effectiveRateSchema,
});

export const transactionSchema = z.discriminatedUnion('type', [
  incomeTransactionSchema,
  expenseTransactionSchema,
  transferTransactionSchema,
]);

export const createTransactionSchema = z.object({
  accountId: objectIdSchema,
  amount: z.number().positive(),
  transactionDate: dateStringSchema,
  description: z.string().max(1000).optional(),
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ transactionDate: true })
  .partial();

export const listTransactionsQuerySchema = paginationQuerySchema
  .extend(periodQuerySchema.shape)
  .extend({
    accountId: objectIdSchema.optional(),
    currency: currencyCodeSchema.optional(),
    transactionType: transactionTypeEnum.optional(),
  });

export const transactionsRevenueSchema = z
  .object({
    totalRevenue: z.number().min(0).nullable(),
    currencies: z.array(
      z.object({
        currency: currencyCodeSchema,
        totalRevenue: z.number().min(0),
      }),
    ),
  })
  .extend(periodQuerySchema.shape);

export const transactionsPaginatedResponseSchema = paginatedResponseSchema(transactionSchema);

export type Transaction = z.infer<typeof transactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type TransactionsPaginatedResponse = z.infer<
  typeof transactionsPaginatedResponseSchema
>;
