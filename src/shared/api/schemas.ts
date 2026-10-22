import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const financialActorSchema = z.object({
  userId: objectIdSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  isAnonymized: z.boolean(),
});

export type FinancialActor = z.infer<typeof financialActorSchema>;

export const dateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  { message: 'Invalid date string' },
);

export const entityMetaSchema = z.object({
  _id: objectIdSchema,
});

export const paginationQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100)
    .optional(),
});

export const paginatedResponseSchema = <TSchema extends z.ZodTypeAny>(
  itemSchema: TSchema,
) => z.object({
  items: z.array(itemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

export const periodQuerySchema = z.object({
  fromDate: dateStringSchema.optional(),
  toDate: dateStringSchema.optional(),
});

export const parseRequiredWithSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
): z.infer<TSchema> => schema.parse(payload);
