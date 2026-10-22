import {
  apiClient, objectIdSchema, paginatedResponseSchema, paginationQuerySchema,
} from '@/shared/api';
import {
  createSpaceSchema, spaceMemberSchema, spacePermissionsSchema, spaceSchema,
  updateSpacePermissionsSchema, updateSpaceSchema,
} from '../model/schemas';
import type {
  CreateSpaceDto, SpacePermissions, SpacesQuery, UpdateSpaceDto,
} from '../model/schemas';

const path = (id: string) => `/spaces/${objectIdSchema.parse(id)}`;
export const spacesApi = {
  async list(query: SpacesQuery = {}, signal?: AbortSignal) {
    const { data } = await apiClient.get('/spaces', { params: paginationQuerySchema.parse(query), signal });
    return paginatedResponseSchema(spaceSchema).parse(data);
  },
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get(path(id), { signal });
    return spaceSchema.parse(data);
  },
  async create(payload: CreateSpaceDto) {
    const { data } = await apiClient.post('/spaces', createSpaceSchema.parse(payload));
    return spaceSchema.parse(data);
  },
  async update(id: string, payload: UpdateSpaceDto) {
    const { data } = await apiClient.patch(path(id), updateSpaceSchema.parse(payload));
    return spaceSchema.parse(data);
  },
  async members(id: string, query: SpacesQuery = {}, signal?: AbortSignal) {
    const { data } = await apiClient.get(`${path(id)}/members`, { params: paginationQuerySchema.parse(query), signal });
    return paginatedResponseSchema(spaceMemberSchema).parse(data);
  },
  async permissions(id: string, userId: string, payload: Partial<SpacePermissions>) {
    const { data } = await apiClient.patch(
      `${path(id)}/members/${objectIdSchema.parse(userId)}/permissions`,
      updateSpacePermissionsSchema.parse(payload),
    );
    return spacePermissionsSchema.parse(data);
  },
  async leave(id: string) {
    await apiClient.post(`${path(id)}/leave`, {});
  },
  async removeMember(id: string, userId: string) {
    await apiClient.delete(`${path(id)}/members/${objectIdSchema.parse(userId)}`);
  },
  async transferOwnership(id: string, userId: string) {
    const { data } = await apiClient.post(`${path(id)}/ownership`, { userId: objectIdSchema.parse(userId) });
    return spaceSchema.parse(data);
  },
  async remove(id: string) {
    await apiClient.delete(path(id));
  },
};
