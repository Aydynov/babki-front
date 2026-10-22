import { z } from 'zod';
import { objectIdSchema, paginatedResponseSchema } from '@/shared/api';

const date = z.iso.datetime();
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const invitationRequestSchema = z.object({ token }).strict();
export const createdInvitationSchema = z.object({ id: objectIdSchema, token, expiresAt: date });
export const invitationPreviewSchema = z.object({
  name: z.string().min(1).max(100), expiresAt: date,
});
export const acceptedInvitationSchema = z.object({ spaceId: objectIdSchema, role: z.literal('member') });
export const invitationListSchema = paginatedResponseSchema(z.object({
  id: objectIdSchema,
  createdBy: objectIdSchema,
  createdAt: date,
  expiresAt: date,
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
  acceptedBy: objectIdSchema.optional(),
  acceptedAt: date.optional(),
  revokedBy: objectIdSchema.optional(),
  revokedAt: date.optional(),
}));
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type CreatedInvitation = z.infer<typeof createdInvitationSchema>;
