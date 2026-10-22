import { z } from 'zod';
import {
  dateStringSchema,
  financialActorSchema,
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';

export const debtStatusSchema = z.enum(['active', 'closed']);

const moneyAmountSchema = z.number();

export const debtSchema = z
  .object({
    spaceId: objectIdSchema,
    createdBy: objectIdSchema,
    createdByActor: financialActorSchema,
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
    debtor: z.string().max(150),
    principalAmount: moneyAmountSchema.positive(),
    remainingAmount: moneyAmountSchema.nonnegative(),
    currency: currencyCodeSchema,
    description: z.string().max(150).optional(),
    dueDate: dateStringSchema.nullable().optional(),
    status: debtStatusSchema,
    archivedAt: dateStringSchema.nullable(),
  })
  .extend({ ...entityMetaSchema.shape, spaceId: objectIdSchema });

export const createDebtSchema = z.object({
  debtor: z.string().max(150),
  principalAmount: moneyAmountSchema.positive(),
  currency: currencyCodeSchema,
  description: z.string().max(150).optional(),
  dueDate: dateStringSchema.optional(),
});

export const updateDebtSchema = createDebtSchema
  .omit({ currency: true })
  .partial()
  .extend({
    dueDate: dateStringSchema.nullable().optional(),
  });

export const repayDebtSchema = z
  .object({
    accountId: objectIdSchema.optional(),
    repaymentDate: dateStringSchema,
    amount: moneyAmountSchema.positive(),
    description: z.string().max(1000).optional(),
    isIncome: z.boolean(),
  })
  .superRefine(({ accountId, isIncome }, context) => {
    if (!isIncome && accountId !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'accountForbidden',
        path: ['accountId'],
      });
    }
    if (isIncome && !accountId) {
      context.addIssue({
        code: 'custom',
        message: 'accountRequired',
        path: ['accountId'],
      });
    }
  });

export const listDebtsQuerySchema = paginationQuerySchema.extend({
  currency: currencyCodeSchema.optional(),
  status: debtStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
});

export const debtsPaginatedResponseSchema = paginatedResponseSchema(debtSchema);

export type Debt = z.infer<typeof debtSchema>;
export type DebtStatus = z.infer<typeof debtStatusSchema>;
export type CreateDebtDto = z.infer<typeof createDebtSchema>;
export type UpdateDebtDto = z.infer<typeof updateDebtSchema>;
export type RepayDebtDto = z.infer<typeof repayDebtSchema>;
export type ListDebtsQuery = z.infer<typeof listDebtsQuerySchema>;
export type DebtsPaginatedResponse = z.infer<
  typeof debtsPaginatedResponseSchema
>;
