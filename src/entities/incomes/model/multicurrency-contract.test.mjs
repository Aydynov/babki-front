import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const load = async (path) => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule(path);
  } finally {
    await server.close();
  }
};

const accountId = '507f1f77bcf86cd799439011';

test('income create requires account while update keeps account and date immutable', async () => {
  const schemas = await load('/src/entities/incomes/model/schemas.ts');
  const create = {
    accountId,
    amount: 100.25,
    transactionDate: '2026-09-23',
    source: 'Зарплата',
  };

  assert.deepEqual(schemas.createIncomeSchema.parse(create), create);
  assert.equal(schemas.createIncomeSchema.safeParse({ ...create, accountId: undefined }).success, false);
  assert.deepEqual(schemas.updateIncomeSchema.parse({
    accountId,
    transactionDate: '2026-09-24',
    amount: 90,
  }), { amount: 90 });
});

test('income response and revenue preserve currency', async () => {
  const schemas = await load('/src/entities/incomes/model/schemas.ts');
  assert.equal(schemas.incomeSchema.safeParse({
    _id: '507f191e810c19729de860ea',
    type: 'income',
    accountId,
    snapshotId: '507f191e810c19729de860eb',
    currency: 'USD',
    amount: 10,
    transactionDate: '2026-09-23T00:00:00.000Z',
  }).success, true);
  assert.deepEqual(schemas.incomeRevenueSchema.parse({
    totalRevenue: null,
    currencies: [
      { currency: 'RUB', totalRevenue: 100 },
      { currency: 'USD', totalRevenue: 10 },
    ],
  }).currencies.map(({ currency }) => currency), ['RUB', 'USD']);
  assert.deepEqual(schemas.listIncomesQuerySchema.parse({ currency: 'USD' }), { currency: 'USD' });
});
