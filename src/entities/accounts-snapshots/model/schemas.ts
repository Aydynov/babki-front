import { z } from 'zod';
import {
  dateStringSchema,
  entityMetaSchema,
  objectIdSchema,
} from '@/shared/api';

export const snapshotSchema = z
  .object({
    accountId: objectIdSchema,
    amount: z.number().min(0),
    date: dateStringSchema,
  })
  .extend(entityMetaSchema.shape);

export const SnapshotFindByQuerySchema = z.object({
  accountId: objectIdSchema,
  date: dateStringSchema,
});

export const snapshotResponseSchema = snapshotSchema.nullable();

export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotFindByQuery = z.infer<typeof SnapshotFindByQuerySchema>;
