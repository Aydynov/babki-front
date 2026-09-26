import { z } from 'zod';
import {
  dateStringSchema,
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
  periodQuerySchema,
} from '@/shared/api';
import { currencyCodeSchema, type CurrencyCode } from '@/shared/lib/currency';

export const transferEffectSchema = z.object({
  accountId: objectIdSchema,
  snapshotId: objectIdSchema,
  amount: z.number().positive(),
  currency: currencyCodeSchema,
});

export const effectiveRateSchema = z.object({
  baseCurrency: currencyCodeSchema,
  quoteCurrency: currencyCodeSchema,
  rate: z.number().positive(),
});

export const transferSchema = z.object({
  type: z.literal('transfer'),
  transactionDate: dateStringSchema,
  description: z.string().max(1000).optional(),
  source: transferEffectSchema,
  destination: transferEffectSchema,
  effectiveRate: effectiveRateSchema,
}).extend(entityMetaSchema.shape).refine(
  ({ source, destination }) => (
    source.currency !== destination.currency || source.amount === destination.amount
  ),
  { message: 'sameCurrencyAmounts', path: ['destination', 'amount'] },
);

export const createTransferSchema = z.object({
  sourceAccountId: objectIdSchema,
  destinationAccountId: objectIdSchema,
  sourceAmount: z.number().positive(),
  destinationAmount: z.number().positive(),
  transactionDate: dateStringSchema,
  description: z.string().max(1000).optional(),
}).refine(
  ({ sourceAccountId, destinationAccountId }) => sourceAccountId !== destinationAccountId,
  { message: 'accountsDistinct', path: ['destinationAccountId'] },
);

export const updateTransferSchema = z.object({
  sourceAmount: z.number().positive().optional(),
  destinationAmount: z.number().positive().optional(),
  description: z.string().max(1000).optional(),
});

export const listTransfersQuerySchema = paginationQuerySchema
  .extend(periodQuerySchema.shape)
  .extend({
    accountId: objectIdSchema.optional(),
    currency: currencyCodeSchema.optional(),
  });

export const transfersPaginatedResponseSchema = paginatedResponseSchema(transferSchema);

export const hasValidSameCurrencyTransferAmounts = (
  transfer: Pick<CreateTransferDto, 'sourceAmount' | 'destinationAmount'>,
  sourceCurrency: CurrencyCode,
  destinationCurrency: CurrencyCode,
) => sourceCurrency !== destinationCurrency || transfer.sourceAmount === transfer.destinationAmount;

export type TransferEffect = z.infer<typeof transferEffectSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type UpdateTransferDto = z.infer<typeof updateTransferSchema>;
export type ListTransfersQuery = z.infer<typeof listTransfersQuerySchema>;
export type TransfersPaginatedResponse = z.infer<typeof transfersPaginatedResponseSchema>;
