import { queryOptions, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { spacesApi } from './spaces.api';
import type {
  Space, SpaceMember, SpacePermissions, SpacesQuery,
} from '../model/schemas';

export const spaceKeys = {
  all: (userId: string) => ['spaces', userId] as const,
  list: (userId: string, query: SpacesQuery) => ['spaces', userId, 'list', query] as const,
  detail: (userId: string, spaceId: string) => ['spaces', userId, 'detail', spaceId] as const,
  members: (userId: string, spaceId: string, query: SpacesQuery) => (
    ['spaces', userId, 'members', spaceId, query] as const
  ),
};
export const spacesQueryOptions = {
  allMembers: (userId: string, spaceId: string) => queryOptions({
    queryKey: ['spaces', userId, 'all-members', spaceId] as const,
    queryFn: async ({ signal }) => {
      const members: SpaceMember[] = [];
      let page = 1;
      let total: number | undefined;
      while (true) {
        // Each page depends on the previous total and must share the abort signal.
        // eslint-disable-next-line no-await-in-loop
        const result = await spacesApi.members(spaceId, { page, limit: 100 }, signal);
        total ??= result.total;
        if (result.total !== total || result.page !== page
          || (result.items.length === 0 && members.length < total)) {
          throw new Error('Неполный список участников. Повторите загрузку.');
        }
        members.push(...result.items);
        if (members.length >= total) return members;
        page += 1;
      }
    },
    enabled: Boolean(userId && spaceId),
  }),
  list: (userId: string, query: SpacesQuery = {}) => queryOptions({
    queryKey: spaceKeys.list(userId, query),
    queryFn: ({ signal }) => spacesApi.list(query, signal),
    enabled: Boolean(userId),
  }),
  detail: (userId: string, spaceId: string) => queryOptions({
    queryKey: spaceKeys.detail(userId, spaceId),
    queryFn: ({ signal }) => spacesApi.get(spaceId, signal),
    enabled: Boolean(userId),
  }),
  members: (userId: string, spaceId: string, query: SpacesQuery = {}) => queryOptions({
    queryKey: spaceKeys.members(userId, spaceId, query),
    queryFn: ({ signal }) => spacesApi.members(spaceId, query, signal),
    enabled: Boolean(userId),
  }),
};
export function useRefreshSpaces(userId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: spaceKeys.all(userId) });
}

export function applySpaceResponse(client: QueryClient, userId: string, space: Space) {
  if (!isActiveBudgetIdentity(client, { userId, spaceId: space.id })) return;
  client.setQueryData(spaceKeys.detail(userId, space.id), space);
  client.setQueriesData<{ items: Space[] }>({ queryKey: ['spaces', userId, 'list'] }, (page) => (
    page ? { ...page, items: page.items.map((item) => (item.id === space.id ? space : item)) } : page
  ));
  client.setQueriesData<{ items: SpaceMember[] }>({ queryKey: ['spaces', userId, 'members', space.id] }, (page) => (
    page ? {
      ...page,
      items: page.items.map((member) => {
        if (member.userId === userId) {
          return {
            ...member, role: space.role, permissions: space.permissions,
          };
        }
        if (member.userId === space.ownerId) {
          return {
            ...member,
            role: 'owner',
            permissions: {
              manageAccounts: true, manageCategories: true, manageLimits: true, manageTransactions: true,
            },
          };
        }
        return member;
      }),
    } : page
  ));
}

export function applySpacePermissions(
  client: QueryClient,
  userId: string,
  spaceId: string,
  memberId: string,
  permissions: SpacePermissions,
) {
  if (!isActiveBudgetIdentity(client, { userId, spaceId })) return;
  client.setQueriesData<{ items: SpaceMember[] }>({ queryKey: ['spaces', userId, 'members', spaceId] }, (page) => (
    page ? {
      ...page,
      items: page.items.map((member) => (member.userId === memberId ? { ...member, permissions } : member)),
    } : page
  ));
}
