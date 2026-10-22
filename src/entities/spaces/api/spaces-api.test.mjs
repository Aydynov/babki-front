import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const userId = 'a'.repeat(24);
const spaceId = 'b'.repeat(24);
const permissions = {
  manageAccounts: true, manageCategories: false, manageLimits: true, manageTransactions: false,
};
const space = {
  id: spaceId,
  ownerId: userId,
  name: 'Пространство',
  role: 'member',
  permissions,
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
};

test('space administration serializes the maintained contract and reads all membership pages with abort', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { spacesApi } = await server.ssrLoadModule('/src/entities/spaces/api/spaces.api.ts');
    const { spacesQueryOptions } = await server.ssrLoadModule('/src/entities/spaces/api/spaces.query.ts');
    const requests = [];
    const controller = new AbortController();
    apiClient.defaults.adapter = async (config) => {
      requests.push(config);
      let data = space;
      if (config.url.endsWith('/permissions')) data = permissions;
      if (config.url.endsWith('/members')) {
        const member = {
          userId, role: 'member', permissions, joinedAt: space.createdAt,
        };
        data = {
          items: [member], total: 2, page: config.params.page, limit: 100,
        };
        assert.equal(config.signal, controller.signal);
      }
      return {
        data, config, headers: {}, status: 200, statusText: 'OK',
      };
    };
    assert.deepEqual(await spacesApi.create({ name: ' Пример ' }), space);
    assert.equal(requests.at(-1).url, '/spaces');
    assert.deepEqual(JSON.parse(requests.at(-1).data), { name: 'Пример' });
    await spacesApi.update(spaceId, { description: '' });
    assert.deepEqual(JSON.parse(requests.at(-1).data), { description: '' });
    await spacesApi.permissions(spaceId, userId, { manageAccounts: false });
    assert.deepEqual(JSON.parse(requests.at(-1).data), { manageAccounts: false });
    assert.equal(requests.at(-1).url, `/spaces/${spaceId}/members/${userId}/permissions`);
    const members = await spacesQueryOptions.allMembers(userId, spaceId).queryFn({ signal: controller.signal });
    assert.equal(members.length, 2);
    assert.deepEqual(requests.slice(-2).map((request) => request.params.page), [1, 2]);
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => ({
      data: {
        items: [], total: 2, page: 1, limit: 100,
      },
      config,
      headers: {},
      status: 200,
      statusText: 'OK',
    });
    await assert.rejects(
      spacesQueryOptions.allMembers(userId, spaceId).queryFn({ signal: controller.signal }),
      /Неполный список участников/,
    );
    apiClient.defaults.adapter = originalAdapter;
    await spacesApi.transferOwnership(spaceId, userId);
    assert.deepEqual(JSON.parse(requests.at(-1).data), { userId });
    assert.equal(requests.at(-1).url, `/spaces/${spaceId}/ownership`);
    apiClient.defaults.adapter = async (config) => ({
      data: '', config, status: 204, statusText: 'No Content', headers: {},
    });
    assert.equal(await spacesApi.leave(spaceId), undefined);
    assert.equal(await spacesApi.remove(spaceId), undefined);
  } finally {
    await server.close();
  }
});

test('invitation preview and acceptance send token-only bodies once and accept responses without type', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { invitationsApi } = await server.ssrLoadModule('/src/features/space-invitations/api/invitations.api.ts');
    const requests = [];
    apiClient.defaults.adapter = async (config) => {
      requests.push(config);
      return {
        config,
        headers: {},
        status: 200,
        statusText: 'OK',
        data: config.url.endsWith('/preview')
          ? { name: space.name, expiresAt: '2026-10-23T00:00:00Z' } : { spaceId, role: 'member' },
      };
    };
    const token = 't'.repeat(43);
    assert.equal((await invitationsApi.preview(token)).name, space.name);
    assert.deepEqual(await invitationsApi.accept(token), { spaceId, role: 'member' });
    assert.deepEqual(requests.map((request) => request.url), [
      '/space-invitations/preview', '/space-invitations/accept',
    ]);
    requests.forEach((request) => assert.deepEqual(JSON.parse(request.data), { token }));
    let attempts = 0;
    apiClient.defaults.adapter = async () => {
      attempts += 1;
      throw Object.assign(new Error('Conflict'), { response: { status: 409 } });
    };
    await assert.rejects(invitationsApi.accept(token));
    assert.equal(attempts, 1);
  } finally {
    await server.close();
  }
});
