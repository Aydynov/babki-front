import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Run explicitly: node --test src/entities/groups/model/groups-contract.test.mjs
// This focused check uses the project's Vite module loader; no global test runner is configured.
test('group creation and explicit permission updates enforce the backend contracts', async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const { createGroupSchema, updateGroupPermissionsSchema, groupSchema } = await server
      .ssrLoadModule('/src/entities/groups/model/schemas.ts');
    assert.deepEqual(createGroupSchema.parse({ name: '  Семья  ', type: 'family' }), {
      name: 'Семья', type: 'family',
    });
    assert.equal(createGroupSchema.safeParse({ name: '   ', type: 'family' }).success, false);
    assert.equal(createGroupSchema.safeParse({ name: 'x'.repeat(101), type: 'family' }).success, false);
    assert.deepEqual(updateGroupPermissionsSchema.parse({ manageTransactions: false }), { manageTransactions: false });
    assert.equal(updateGroupPermissionsSchema.safeParse({}).success, false);
    assert.equal(updateGroupPermissionsSchema.safeParse({ manageAccounts: 'true' }).success, false);
    assert.equal(updateGroupPermissionsSchema.safeParse({ role: 'owner' }).success, false);
    const permissions = {
      manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
    };
    const parsed = groupSchema.parse({
      id: 'a'.repeat(24),
      ownerId: 'b'.repeat(24),
      name: 'Семья',
      type: 'family',
      role: 'member',
      permissions,
      createdAt: '2026-10-18T00:00:00.000Z',
      updatedAt: '2026-10-18T00:00:00.000Z',
    });
    assert.deepEqual(parsed.permissions, permissions);
    assert.equal(parsed.role, 'member');
  } finally {
    await server.close();
  }
});
