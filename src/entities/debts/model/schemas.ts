import { z } from 'zod';
import {
  dateStringSchema,
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
    debtor: z.string().max(150),
    principalAmount: moneyAmountSchema.min(0.01),
    remainingAmount: moneyAmountSchema.min(0),
    currency: currencyCodeSchema,
    description: z.string().max(150).optional(),
    dueDate: dateStringSchema.optional(),
    status: debtStatusSchema,
    archivedAt: dateStringSchema.nullable(),
  })
  .extend(entityMetaSchema.shape);

export const createDebtSchema = z.object({
  debtor: z.string().max(150),
  principalAmount: moneyAmountSchema.min(0.01),
  remainingAmount: moneyAmountSchema.min(0),
  currency: currencyCodeSchema,
  description: z.string().max(150).optional(),
  dueDate: dateStringSchema.optional(),
  status: debtStatusSchema.optional(),
});

export const updateDebtSchema = createDebtSchema.omit({ currency: true }).partial();

export const repayDebtSchema = z.object({
  accountId: objectIdSchema.optional(),
  repaymentDate: dateStringSchema,
  amount: moneyAmountSchema.min(0.01),
  description: z.string().max(1000).optional(),
  isIncome: z.boolean().optional(),
}).superRefine(({ accountId, isIncome }, context) => {
  if (isIncome && !accountId) {
    context.addIssue({ code: 'custom', message: 'accountRequired', path: ['accountId'] });
  }
});

export const listDebtsQuerySchema = paginationQuerySchema.extend({
  currency: currencyCodeSchema.optional(),
  status: debtStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
});

export const debtsPaginatedResponseSchema = paginatedResponseSchema(debtSchema);

export type Debt = z.infer<typeof debtSchema> | GroupDebt;
export type DebtStatus = z.infer<typeof debtStatusSchema>;
export type CreateDebtDto = z.infer<typeof createDebtSchema>;
export type UpdateDebtDto = z.infer<typeof updateDebtSchema>;
export type RepayDebtDto = z.infer<typeof repayDebtSchema>;
export type ListDebtsQuery = z.infer<typeof listDebtsQuerySchema>;
export type DebtsPaginatedResponse = z.infer<typeof debtsPaginatedResponseSchema>;

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

export const groupDebtSchema = debtSchema.extend({
  ...groupOwnershipSchema.shape,
  principalAmount: z.number().finite().positive(),
  remainingAmount: z.number().finite().nonnegative(),
  dueDate: dateStringSchema.nullable().optional(),
});
export const groupDebtsPaginatedResponseSchema = paginatedResponseSchema(groupDebtSchema);
export const createGroupDebtSchema = createDebtSchema.omit({ remainingAmount: true, status: true }).extend({
  principalAmount: z.number().finite().positive(),
});
export const updateGroupDebtSchema = createGroupDebtSchema.omit({ currency: true }).partial().extend({
  dueDate: dateStringSchema.nullable().optional(),
});
export const repayGroupDebtSchema = repayDebtSchema.safeExtend({
  amount: z.number().finite().positive(),
  isIncome: z.boolean(),
}).superRefine(({ accountId, isIncome }, context) => {
  if (!isIncome && accountId !== undefined) {
    context.addIssue({ code: 'custom', message: 'accountForbidden', path: ['accountId'] });
  }
});
export type GroupDebt = z.infer<typeof groupDebtSchema>;
export type CreateGroupDebtDto = z.infer<typeof createGroupDebtSchema>;
export type UpdateGroupDebtDto = z.infer<typeof updateGroupDebtSchema>;
