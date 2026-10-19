import { z } from 'zod';
import { dateStringSchema, objectIdSchema, paginationQuerySchema } from '@/shared/api';

export const groupPermissionsSchema = z.object({
  manageAccounts: z.boolean(),
  manageCategories: z.boolean(),
  manageLimits: z.boolean(),
  manageTransactions: z.boolean(),
});
export const groupSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  type: z.enum(['family', 'organization']),
  description: z.string().optional(),
  ownerId: objectIdSchema,
  role: z.enum(['owner', 'member']),
  permissions: groupPermissionsSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});
export const groupMemberSchema = z.object({
  userId: objectIdSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['owner', 'member']),
  joinedAt: dateStringSchema,
  permissions: groupPermissionsSchema,
});
export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['family', 'organization']),
  description: z.string().max(1000).optional(),
}).strict();
export const updateGroupSchema = createGroupSchema.omit({ type: true }).partial()
  .refine((value) => Object.keys(value).length > 0);
export const updateGroupPermissionsSchema = groupPermissionsSchema.partial().strict()
  .refine((value) => Object.keys(value).length > 0);
export type Group = z.infer<typeof groupSchema>;
export type GroupPermissions = z.infer<typeof groupPermissionsSchema>;
export type GroupMember = z.infer<typeof groupMemberSchema>;
export type GroupsQuery = z.infer<typeof paginationQuerySchema>;
export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
