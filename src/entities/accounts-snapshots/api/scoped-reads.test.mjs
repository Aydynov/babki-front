import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Run explicitly: node --test src/entities/accounts-snapshots/api/scoped-reads.test.mjs
// Local Axios GET replacement: this test performs no network requests.
test('scoped reads forward signals and reject unsupported group snapshots before requesting', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { groupsQueryOptions } = await server.ssrLoadModule('/src/entities/groups/api/groups.query.ts');
    const { snapshotsQueryOptions, snapshotsQueryKeys } = await server
      .ssrLoadModule('/src/entities/accounts-snapshots/api/snapshots.query.ts');
    const originalGet = apiClient.get;
    const userId = 'a'.repeat(24);
    const groupId = 'b'.repeat(24);
    const accountId = 'c'.repeat(24);
    const date = '2026-10-31';
    const group = {
      id: groupId,
      ownerId: userId,
      role: 'member',
      name: 'Семья',
      type: 'family',
      permissions: {
        manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
      },
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z',
    };
    const calls = [];
    apiClient.get = async (url, config) => {
      calls.push({ url, config });
      if (url.endsWith('/snapshots')) return { data: null };
      if (url === `/groups/${groupId}`) return { data: group };
      return {
        data: {
          items: [], total: 0, page: 1, limit: 20,
        },
      };
    };
    try {
      const controller = new AbortController();
      const options = [
        groupsQueryOptions.list(userId),
        groupsQueryOptions.detail(userId, groupId),
        groupsQueryOptions.members(userId, groupId),
      ];
      await Promise.all(options.map(({ queryFn }) => queryFn({ signal: controller.signal })));
      assert.equal(calls.length, 3);
      assert.ok(calls.every(({ config }) => config.signal === controller.signal));
      calls.length = 0;
      const personal = { kind: 'personal', userId };
      const family = { kind: 'group', userId, groupId };
      const params = { accountId, date };
      const personalQuery = snapshotsQueryOptions.findBy(params, personal);
      const familyQuery = snapshotsQueryOptions.findBy(params, family);
      assert.notDeepEqual(personalQuery.queryKey, familyQuery.queryKey);
      assert.notDeepEqual(familyQuery.queryKey, snapshotsQueryOptions.findBy(params, {
        ...family, groupId: 'd'.repeat(24),
      }).queryKey);
      assert.notDeepEqual(personalQuery.queryKey, snapshotsQueryOptions.findBy(params, {
        ...personal, userId: 'e'.repeat(24),
      }).queryKey);
      assert.deepEqual(personalQuery.queryKey, snapshotsQueryKeys.detail(accountId, date, personal));
      assert.equal(await personalQuery.queryFn({ signal: controller.signal }), null);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, `/accounts/${accountId}/snapshots`);
      assert.equal(calls[0].config.signal, controller.signal);
      assert.deepEqual(calls[0].config.params, { date });
      calls.length = 0;
      await assert.rejects(familyQuery.queryFn({ signal: controller.signal }), /исторический остаток/);
      assert.equal(calls.length, 0);
    } finally {
      apiClient.get = originalGet;
    }
  } finally {
    await server.close();
  }
});
