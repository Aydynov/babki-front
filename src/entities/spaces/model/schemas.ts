import { z } from 'zod';
import { dateStringSchema, objectIdSchema, paginationQuerySchema } from '@/shared/api';

export const spacePermissionsSchema = z.object({
  manageAccounts: z.boolean(),
  manageCategories: z.boolean(),
  manageLimits: z.boolean(),
  manageTransactions: z.boolean(),
});
export const spaceSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  description: z.string().optional(),
  ownerId: objectIdSchema,
  role: z.enum(['owner', 'member']),
  permissions: spacePermissionsSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});
export const spaceMemberSchema = z.object({
  userId: objectIdSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['owner', 'member']),
  joinedAt: dateStringSchema,
  permissions: spacePermissionsSchema,
});
export const createSpaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(1000).optional(),
}).strict();
export const updateSpaceSchema = createSpaceSchema.partial()
  .refine((value) => Object.keys(value).length > 0);
export const updateSpacePermissionsSchema = spacePermissionsSchema.partial().strict()
  .refine((value) => Object.keys(value).length > 0);
export type Space = z.infer<typeof spaceSchema>;
export type SpacePermissions = z.infer<typeof spacePermissionsSchema>;
export type SpaceMember = z.infer<typeof spaceMemberSchema>;
export type SpacesQuery = z.infer<typeof paginationQuerySchema>;
export type CreateSpaceDto = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceDto = z.infer<typeof updateSpaceSchema>;
