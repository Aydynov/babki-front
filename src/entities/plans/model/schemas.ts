import { z } from 'zod';
import {
  dateStringSchema,
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';

export const planStatusSchema = z.enum(['active', 'closed']);

export const planSchema = z
  .object({
    userId: objectIdSchema,
    description: z.string().max(500),
    targetDate: dateStringSchema,
    amount: z.number().min(0.01),
    currency: currencyCodeSchema,
    categoryId: objectIdSchema,
    status: planStatusSchema,
    archivedAt: dateStringSchema.nullable(),
    closedAt: dateStringSchema.optional(),
    expenseId: objectIdSchema.optional(),
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
  })
  .extend(entityMetaSchema.shape);

export const listPlansQuerySchema = paginationQuerySchema.extend({
  currency: currencyCodeSchema.optional(),
  status: planStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
});

export const plansPaginatedResponseSchema = paginatedResponseSchema(planSchema);

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type Plan = z.infer<typeof planSchema> | GroupPlan;
export type ListPlansQuery = z.infer<typeof listPlansQuerySchema>;
export type PlansPaginatedResponse = z.infer<typeof plansPaginatedResponseSchema>;

export const createPlanPayloadSchema = z.object({
  currency: currencyCodeSchema,
  description: z.string().max(500),
  targetDate: dateStringSchema,
  amount: z.number().min(0.01),
  categoryId: objectIdSchema,
});

export type CreatePlanPayload = z.infer<typeof createPlanPayloadSchema>;

export const updatePlanPayloadSchema = z.object({
  description: z.string().max(500).optional(),
  targetDate: dateStringSchema.optional(),
  amount: z.number().min(0.01).optional(),
  categoryId: objectIdSchema.optional(),
});

export type UpdatePlanPayload = z.infer<typeof updatePlanPayloadSchema>;

export const closePlanPayloadSchema = z.object({
  accountId: objectIdSchema,
  closingDate: dateStringSchema.optional(),
  amount: z.number().min(0.01).optional(),
  description: z.string().max(500).optional(),
});

export type ClosePlanPayload = z.infer<typeof closePlanPayloadSchema>;

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

export const groupPlanSchema = planSchema.omit({ userId: true }).extend({
  ...groupOwnershipSchema.shape,
  amount: z.number().finite().positive(),
});
export const groupPlansPaginatedResponseSchema = paginatedResponseSchema(groupPlanSchema);
export const createGroupPlanPayloadSchema = createPlanPayloadSchema.extend({ amount: z.number().finite().positive() });
export const updateGroupPlanPayloadSchema = updatePlanPayloadSchema.extend({
  amount: z.number().finite().positive().optional(),
});
export const closeGroupPlanPayloadSchema = closePlanPayloadSchema.extend({
  amount: z.number().finite().positive().optional(),
});
export type GroupPlan = z.infer<typeof groupPlanSchema>;
