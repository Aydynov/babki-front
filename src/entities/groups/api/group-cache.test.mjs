import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { QueryClient } from '@tanstack/react-query';

// Run explicitly: node --test src/entities/groups/api/group-cache.test.mjs
// Local cache only: no request is sent to the API.
test('confirmed ownership and permissions survive failed refresh and ignore a changed identity', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  try {
    const { groupKeys, applyGroupResponse, applyGroupPermissions } = await server
      .ssrLoadModule('/src/entities/groups/api/groups.query.ts');
    const userId = 'a'.repeat(24);
    const nextOwnerId = 'b'.repeat(24);
    const groupId = 'c'.repeat(24);
    const none = {
      manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
    };
    const full = {
      manageAccounts: true, manageCategories: true, manageLimits: true, manageTransactions: true,
    };
    const group = {
      id: groupId,
      ownerId: userId,
      name: 'Семья',
      type: 'family',
      role: 'owner',
      permissions: full,
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z',
    };
    client.setQueryData(['users', 'me'], { _id: userId });
    const detailKey = groupKeys.detail(userId, groupId);
    const listKey = groupKeys.list(userId, { page: 1 });
    const memberKey = groupKeys.members(userId, groupId, { page: 1 });
    client.setQueryData(detailKey, group);
    client.setQueryData(listKey, {
      items: [group], total: 1, page: 1, limit: 20,
    });
    client.setQueryData(memberKey, {
      items: [
        { userId, role: 'owner', permissions: full },
        { userId: nextOwnerId, role: 'member', permissions: none },
      ],
      total: 2,
      page: 1,
      limit: 20,
    });
    applyGroupPermissions(client, userId, groupId, nextOwnerId, full);
    assert.equal(client.getQueryData(memberKey).items[1].role, 'member');
    assert.deepEqual(client.getQueryData(memberKey).items[1].permissions, full);
    const partial = { ...full, manageLimits: false };
    applyGroupPermissions(client, userId, groupId, nextOwnerId, partial);
    assert.deepEqual(client.getQueryData(memberKey).items[1].permissions, partial);
    const transferred = {
      ...group, ownerId: nextOwnerId, role: 'member', permissions: none,
    };
    applyGroupResponse(client, userId, transferred);
    await assert.rejects(client.fetchQuery({ queryKey: detailKey, queryFn: () => Promise.reject(new Error('503')) }));
    assert.deepEqual(client.getQueryData(detailKey), transferred);
    assert.deepEqual(client.getQueryData(listKey).items[0], transferred);
    assert.equal(client.getQueryData(memberKey).items[0].role, 'member');
    assert.deepEqual(client.getQueryData(memberKey).items[0].permissions, none);
    assert.equal(client.getQueryData(memberKey).items[1].role, 'owner');
    assert.deepEqual(client.getQueryData(memberKey).items[1].permissions, full);
    client.setQueryData(['users', 'me'], { _id: nextOwnerId });
    applyGroupResponse(client, userId, group);
    applyGroupPermissions(client, userId, groupId, nextOwnerId, none);
    assert.deepEqual(client.getQueryData(detailKey), transferred);
    assert.deepEqual(client.getQueryData(memberKey).items[1].permissions, full);
  } finally {
    client.clear();
    await server.close();
  }
});
