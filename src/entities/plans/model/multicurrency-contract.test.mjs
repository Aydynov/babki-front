import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule('/src/entities/plans/model/schemas.ts');
  } finally {
    await server.close();
  }
};

test('plans require immutable currency and account-scoped closure', async () => {
  const schemas = await loadSchemas();
  const categoryId = '507f1f77bcf86cd799439011';
  const accountId = '507f1f77bcf86cd799439012';
  const create = {
    description: 'Отпуск',
    targetDate: '2026-12-01',
    amount: 1000,
    categoryId,
    currency: 'EUR',
  };

  assert.deepEqual(schemas.createPlanPayloadSchema.parse(create), create);
  assert.deepEqual(schemas.updatePlanPayloadSchema.parse({ amount: 900, currency: 'RUB' }), { amount: 900 });
  assert.deepEqual(schemas.listPlansQuerySchema.parse({ status: 'active', currency: 'EUR' }), {
    status: 'active',
    currency: 'EUR',
  });
  assert.equal(schemas.planSchema.safeParse({
    _id: '507f1f77bcf86cd799439013',
    userId: '507f1f77bcf86cd799439014',
    ...create,
    status: 'active',
    archivedAt: null,
    createdAt: '2026-09-23',
    updatedAt: '2026-09-23',
  }).success, true);
  assert.deepEqual(schemas.closePlanPayloadSchema.parse({ accountId }), { accountId });
});
