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

export const planStatusSchema = z.enum(['active', 'closed']);

export const planSchema = z
  .object({
    spaceId: objectIdSchema,
    createdBy: objectIdSchema,
    createdByActor: financialActorSchema,
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
    description: z.string().max(500),
    targetDate: dateStringSchema,
    amount: z.number().positive(),
    currency: currencyCodeSchema,
    categoryId: objectIdSchema,
    status: planStatusSchema,
    archivedAt: dateStringSchema.nullable(),
    closedAt: dateStringSchema.optional(),
    expenseId: objectIdSchema.optional(),
  })
  .extend({ ...entityMetaSchema.shape, spaceId: objectIdSchema });

export const listPlansQuerySchema = paginationQuerySchema.extend({
  currency: currencyCodeSchema.optional(),
  status: planStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
});

export const plansPaginatedResponseSchema = paginatedResponseSchema(planSchema);

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type Plan = z.infer<typeof planSchema>;
export type ListPlansQuery = z.infer<typeof listPlansQuerySchema>;
export type PlansPaginatedResponse = z.infer<
  typeof plansPaginatedResponseSchema
>;

export const createPlanPayloadSchema = z.object({
  currency: currencyCodeSchema,
  description: z.string().max(500),
  targetDate: dateStringSchema,
  amount: z.number().positive(),
  categoryId: objectIdSchema,
});

export type CreatePlanPayload = z.infer<typeof createPlanPayloadSchema>;

export const updatePlanPayloadSchema = z.object({
  description: z.string().max(500).optional(),
  targetDate: dateStringSchema.optional(),
  amount: z.number().positive().optional(),
  categoryId: objectIdSchema.optional(),
});

export type UpdatePlanPayload = z.infer<typeof updatePlanPayloadSchema>;

export const closePlanPayloadSchema = z.object({
  accountId: objectIdSchema,
  participantId: objectIdSchema.optional(),
  closingDate: dateStringSchema.optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
});

export type ClosePlanPayload = z.infer<typeof closePlanPayloadSchema>;
