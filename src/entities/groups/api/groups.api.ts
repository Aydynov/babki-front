import {
  apiClient, objectIdSchema, paginatedResponseSchema, paginationQuerySchema,
} from '@/shared/api';
import {
  createGroupSchema, groupMemberSchema, groupPermissionsSchema, groupSchema,
  updateGroupPermissionsSchema, updateGroupSchema,
} from '../model/schemas';
import type {
  CreateGroupDto, GroupPermissions, GroupsQuery, UpdateGroupDto,
} from '../model/schemas';

const path = (id: string) => `/groups/${objectIdSchema.parse(id)}`;
export const groupsApi = {
  async list(query: GroupsQuery = {}, signal?: AbortSignal) {
    const { data } = await apiClient.get('/groups', { params: paginationQuerySchema.parse(query), signal });
    return paginatedResponseSchema(groupSchema).parse(data);
  },
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get(path(id), { signal });
    return groupSchema.parse(data);
  },
  async create(payload: CreateGroupDto) {
    const { data } = await apiClient.post('/groups', createGroupSchema.parse(payload));
    return groupSchema.parse(data);
  },
  async update(id: string, payload: UpdateGroupDto) {
    const { data } = await apiClient.patch(path(id), updateGroupSchema.parse(payload));
    return groupSchema.parse(data);
  },
  async members(id: string, query: GroupsQuery = {}, signal?: AbortSignal) {
    const { data } = await apiClient.get(`${path(id)}/members`, { params: paginationQuerySchema.parse(query), signal });
    return paginatedResponseSchema(groupMemberSchema).parse(data);
  },
  async permissions(id: string, userId: string, payload: Partial<GroupPermissions>) {
    const { data } = await apiClient.patch(
      `${path(id)}/members/${objectIdSchema.parse(userId)}/permissions`,
      updateGroupPermissionsSchema.parse(payload),
    );
    return groupPermissionsSchema.parse(data);
  },
  async leave(id: string) {
    await apiClient.post(`${path(id)}/leave`, {});
  },
  async removeMember(id: string, userId: string) {
    await apiClient.delete(`${path(id)}/members/${objectIdSchema.parse(userId)}`);
  },
  async transferOwnership(id: string, userId: string) {
    const { data } = await apiClient.post(`${path(id)}/ownership`, { userId: objectIdSchema.parse(userId) });
    return groupSchema.parse(data);
  },
  async remove(id: string) {
    await apiClient.delete(path(id));
  },
};
