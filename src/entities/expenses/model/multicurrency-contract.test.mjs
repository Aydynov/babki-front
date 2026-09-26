import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule('/src/entities/expenses/model/schemas.ts');
  } finally {
    await server.close();
  }
};

const create = {
  accountId: '507f1f77bcf86cd799439011',
  categoryId: '507f191e810c19729de860ea',
  amount: 12.5,
  transactionDate: '2026-09-23',
  description: 'Обед',
};

test('expense create requires account while update cannot move the expense', async () => {
  const schemas = await loadSchemas();

  assert.deepEqual(schemas.createExpenseSchema.parse(create), create);
  assert.equal(schemas.createExpenseSchema.safeParse({ ...create, accountId: undefined }).success, false);
  assert.deepEqual(schemas.updateExpenseSchema.parse({
    accountId: create.accountId,
    transactionDate: '2026-09-24',
    amount: 10,
  }), { amount: 10 });
});

test('expense list and revenue contracts expose currency', async () => {
  const schemas = await loadSchemas();

  assert.deepEqual(schemas.listExpensesQuerySchema.parse({ currency: 'RUB' }), { currency: 'RUB' });
  assert.equal(schemas.expenseRevenueSchema.safeParse({
    totalRevenue: 12.5,
    currencies: [{ currency: 'RUB', totalRevenue: 12.5 }],
  }).success, true);
});
