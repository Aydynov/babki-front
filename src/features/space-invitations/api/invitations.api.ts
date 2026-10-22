import { z } from 'zod';
import { apiClient, objectIdSchema } from '@/shared/api';
import {
  acceptedInvitationSchema,
  createdInvitationSchema,
  invitationListSchema,
  invitationPreviewSchema,
  invitationRequestSchema,
} from '../model/schemas';

const path = (spaceId: string) => `/spaces/${objectIdSchema.parse(spaceId)}/invitations`;
// Secret-bearing operations deliberately bypass TanStack Query/mutation cache.
export const invitationsApi = {
  create: async (spaceId: string) => createdInvitationSchema.parse(
    (await apiClient.post(path(spaceId), z.object({}).strict().parse({}))).data,
  ),
  list: async (spaceId: string, page: number, signal?: AbortSignal) => invitationListSchema.parse(
    (await apiClient.get(path(spaceId), { params: { page, limit: 20 }, signal })).data,
  ),
  revoke: async (spaceId: string, id: string) => {
    await apiClient.delete(`${path(spaceId)}/${objectIdSchema.parse(id)}`);
  },
  preview: async (token: string, signal?: AbortSignal) => invitationPreviewSchema.parse(
    (await apiClient.post('/space-invitations/preview', invitationRequestSchema.parse({ token }), { signal })).data,
  ),
  accept: async (token: string) => acceptedInvitationSchema.parse(
    (await apiClient.post('/space-invitations/accept', invitationRequestSchema.parse({ token }))).data,
  ),
};
