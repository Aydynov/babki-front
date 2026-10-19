import { queryOptions, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { groupsApi } from './groups.api';
import type {
  Group, GroupMember, GroupPermissions, GroupsQuery,
} from '../model/schemas';

export const groupKeys = {
  all: (userId: string) => ['groups', userId] as const,
  list: (userId: string, query: GroupsQuery) => ['groups', userId, 'list', query] as const,
  detail: (userId: string, groupId: string) => ['groups', userId, 'detail', groupId] as const,
  members: (userId: string, groupId: string, query: GroupsQuery) => (
    ['groups', userId, 'members', groupId, query] as const
  ),
};
export const groupsQueryOptions = {
  list: (userId: string, query: GroupsQuery = {}) => queryOptions({
    queryKey: groupKeys.list(userId, query),
    queryFn: ({ signal }) => groupsApi.list(query, signal),
    enabled: Boolean(userId),
  }),
  detail: (userId: string, groupId: string) => queryOptions({
    queryKey: groupKeys.detail(userId, groupId),
    queryFn: ({ signal }) => groupsApi.get(groupId, signal),
    enabled: Boolean(userId),
  }),
  members: (userId: string, groupId: string, query: GroupsQuery = {}) => queryOptions({
    queryKey: groupKeys.members(userId, groupId, query),
    queryFn: ({ signal }) => groupsApi.members(groupId, query, signal),
    enabled: Boolean(userId),
  }),
};
export function useRefreshGroups(userId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: groupKeys.all(userId) });
}

export function applyGroupResponse(client: QueryClient, userId: string, group: Group) {
  if (!isActiveBudgetIdentity(client, { kind: 'group', userId, groupId: group.id })) return;
  client.setQueryData(groupKeys.detail(userId, group.id), group);
  client.setQueriesData<{ items: Group[] }>({ queryKey: ['groups', userId, 'list'] }, (page) => (
    page ? { ...page, items: page.items.map((item) => (item.id === group.id ? group : item)) } : page
  ));
  client.setQueriesData<{ items: GroupMember[] }>({ queryKey: ['groups', userId, 'members', group.id] }, (page) => (
    page ? {
      ...page,
      items: page.items.map((member) => {
        if (member.userId === userId) {
          return {
            ...member, role: group.role, permissions: group.permissions,
          };
        }
        if (member.userId === group.ownerId) {
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

export function applyGroupPermissions(
  client: QueryClient,
  userId: string,
  groupId: string,
  memberId: string,
  permissions: GroupPermissions,
) {
  if (!isActiveBudgetIdentity(client, { kind: 'group', userId, groupId })) return;
  client.setQueriesData<{ items: GroupMember[] }>({ queryKey: ['groups', userId, 'members', groupId] }, (page) => (
    page ? {
      ...page,
      items: page.items.map((member) => (member.userId === memberId ? { ...member, permissions } : member)),
    } : page
  ));
}
