import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule('/src/entities/expense-limits/model/schemas.ts');
  } finally {
    await server.close();
  }
};

test('expense limits carry immutable currency through response, create, and filters', async () => {
  const schemas = await loadSchemas();
  const categoryId = '507f1f77bcf86cd799439011';
  const limit = {
    _id: '507f1f77bcf86cd799439012',
    category: {
      _id: categoryId,
      name: 'Еда',
      color: '#ffffff',
      isArchived: false,
      createdAt: '2026-09-01',
      updatedAt: '2026-09-01',
    },
    currency: 'USD',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    total: 100,
    rest: 25,
  };

  assert.deepEqual(schemas.expenseLimitSchema.parse(limit), limit);
  assert.deepEqual(schemas.createExpenseLimitSchema.parse({
    categoryId,
    currency: 'USD',
    total: 100,
  }), { categoryId, currency: 'USD', total: 100 });
  assert.deepEqual(schemas.updateExpenseLimitSchema.parse({ total: 90, currency: 'RUB' }), { total: 90 });
  assert.deepEqual(schemas.findExpenseLimitQuerySchema.parse({
    periodDate: '2026-09-15',
    categoryId,
    currency: 'USD',
  }), { periodDate: '2026-09-15', categoryId, currency: 'USD' });
});
