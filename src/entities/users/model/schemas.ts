import { z } from 'zod';
import {
  entityMetaSchema,
  paginatedResponseSchema,
} from '@/shared/api';

export const userSchema = z
  .object({
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    email: z.email(),
    description: z.string().max(2000).optional(),
  })
  .extend(entityMetaSchema.shape);

export const updateUserSchema = z.object({
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.email(),
  description: z.string().max(2000).optional(),
}).partial().strict();

export const usersPaginatedResponseSchema = paginatedResponseSchema(userSchema);

export type User = z.infer<typeof userSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UsersPaginatedResponse = z.infer<typeof usersPaginatedResponseSchema>;
