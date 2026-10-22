import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('validates retained actor identity and hides anonymized names', async () => {
  const server = await createServer({
    appType: 'custom', logLevel: 'silent', server: { middlewareMode: true },
  });
  try {
    const { financialActorSchema } = await server.ssrLoadModule('/src/shared/api/schemas.ts');
    assert.ok(financialActorSchema, 'shared actor contract must exist');
    const actor = {
      userId: '507f1f77bcf86cd799439011', firstName: null, lastName: null, isAnonymized: true,
    };
    assert.deepEqual(financialActorSchema.parse(actor), actor);
    assert.equal(financialActorSchema.safeParse({ ...actor, userId: null }).success, false);
    const { actorLabel } = await server.ssrLoadModule('/src/shared/lib/actor-label/index.ts');
    assert.equal(actorLabel({ ...actor, firstName: 'Stale', lastName: 'Cached' }), 'Удалённый пользователь');
    assert.equal(actorLabel({
      ...actor, isAnonymized: false, firstName: 'Анна', lastName: 'Иванова',
    }), 'Анна Иванова');
    assert.equal(actorLabel({ ...actor, isAnonymized: false }), 'Участник');
  } finally {
    await server.close();
  }
});
