import { z } from 'zod';
import {
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
} from '@/shared/api';
import { currencyCodeSchema } from '@/shared/lib/currency';

export const userSchema = z
  .object({
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    email: z.email(),
    description: z.string().max(2000).optional(),
    defaultCurrency: currencyCodeSchema,
    defaultAccountId: objectIdSchema.nullable(),
  })
  .extend(entityMetaSchema.shape);

export const updateUserSchema = z.object({
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.email(),
  description: z.string().max(2000).optional(),
  defaultCurrency: currencyCodeSchema,
  defaultAccountId: objectIdSchema.nullable(),
}).partial();

export const usersPaginatedResponseSchema = paginatedResponseSchema(userSchema);

export type User = z.infer<typeof userSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UsersPaginatedResponse = z.infer<typeof usersPaginatedResponseSchema>;
