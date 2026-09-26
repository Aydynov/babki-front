import { snapshotSchema } from '@/entities/accounts-snapshots/@x/accounts';
import { z } from 'zod';
import {
  dateStringSchema,
  entityMetaSchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';

export const accountTypeEnum = z.enum(['balance', 'saving']);

export const accountSchema = z
  .object({
    name: z.string().min(1).max(100),
    amount: z.number().min(0),
    initialAmount: z.number().min(0),
    currency: currencyCodeSchema,
    openedAt: dateStringSchema,
    archivedAt: dateStringSchema.nullable(),
    timeline: snapshotSchema.array(),
    type: accountTypeEnum,
  })
  .extend(entityMetaSchema.shape);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: accountTypeEnum,
  currency: currencyCodeSchema,
  amount: z.number().min(0).optional(),
  openedAt: dateStringSchema.optional(),
});

export const renameAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const upsertAccountSchema = z.object({ amount: z.number().min(0) });

export const findAccountByQuerySchema = z.object({
  type: accountTypeEnum.optional(),
  currency: currencyCodeSchema.optional(),
  toDate: dateStringSchema.optional(),
});

export type Account = z.infer<typeof accountSchema>;
export type AccountType = z.infer<typeof accountTypeEnum>;
export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type RenameAccountDto = z.infer<typeof renameAccountSchema>;
export type UpsertAccountDto = z.infer<typeof upsertAccountSchema>;
export type FindAccountByQuery = z.infer<typeof findAccountByQuerySchema>;
