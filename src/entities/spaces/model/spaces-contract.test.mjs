import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Run explicitly: node --test src/entities/spaces/model/spaces-contract.test.mjs
// This focused check uses the project's Vite module loader; no global test runner is configured.
test('space creation and explicit permission updates enforce the backend contracts', async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const { createSpaceSchema, updateSpacePermissionsSchema, spaceSchema } = await server
      .ssrLoadModule('/src/entities/spaces/model/schemas.ts');
    assert.deepEqual(createSpaceSchema.parse({ name: '  Пространство  ' }), {
      name: 'Пространство',
    });
    assert.equal(createSpaceSchema.safeParse({ name: '   ', type: 'family' }).success, false);
    assert.equal(createSpaceSchema.safeParse({ name: 'x'.repeat(101), type: 'family' }).success, false);
    assert.deepEqual(updateSpacePermissionsSchema.parse({ manageTransactions: false }), { manageTransactions: false });
    assert.equal(updateSpacePermissionsSchema.safeParse({}).success, false);
    assert.equal(updateSpacePermissionsSchema.safeParse({ manageAccounts: 'true' }).success, false);
    assert.equal(updateSpacePermissionsSchema.safeParse({ role: 'owner' }).success, false);
    const permissions = {
      manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
    };
    const parsed = spaceSchema.parse({
      id: 'a'.repeat(24),
      ownerId: 'b'.repeat(24),
      name: 'Семья',
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
