import { z } from 'zod';
import { apiClient, objectIdSchema } from '@/shared/api';
import {
  acceptedInvitationSchema,
  createdInvitationSchema,
  invitationListSchema,
  invitationPreviewSchema,
  invitationRequestSchema,
} from '../model/schemas';

const path = (groupId: string) => `/groups/${objectIdSchema.parse(groupId)}/invitations`;
// Secret-bearing operations deliberately bypass TanStack Query/mutation cache.
export const invitationsApi = {
  create: async (groupId: string) => createdInvitationSchema.parse(
    (await apiClient.post(path(groupId), z.object({}).strict().parse({}))).data,
  ),
  list: async (groupId: string, page: number, signal?: AbortSignal) => invitationListSchema.parse(
    (await apiClient.get(path(groupId), { params: { page, limit: 20 }, signal })).data,
  ),
  revoke: async (groupId: string, id: string) => {
    await apiClient.delete(`${path(groupId)}/${objectIdSchema.parse(id)}`);
  },
  preview: async (token: string, signal?: AbortSignal) => invitationPreviewSchema.parse(
    (await apiClient.post('/group-invitations/preview', invitationRequestSchema.parse({ token }), { signal })).data,
  ),
  accept: async (token: string) => acceptedInvitationSchema.parse(
    (await apiClient.post('/group-invitations/accept', invitationRequestSchema.parse({ token }))).data,
  ),
};
