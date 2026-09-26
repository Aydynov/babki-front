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

const id = (suffix) => `507f1f77bcf86cd7994390${suffix}`;

test('parses income, expense, and paired transfer transactions', async () => {
  const schemas = await load('/src/entities/transactions/model/schemas.ts');
  const base = { _id: id(11), transactionDate: '2026-09-23', description: 'Операция' };
  const scalar = {
    ...base, accountId: id(12), snapshotId: id(13), currency: 'USD', amount: 10,
  };
  const effect = {
    accountId: id(12), snapshotId: id(13), currency: 'USD', amount: 10,
  };

  assert.equal(schemas.transactionSchema.safeParse({ ...scalar, type: 'income' }).success, true);
  assert.equal(schemas.transactionSchema.safeParse({ ...scalar, type: 'expense' }).success, true);
  assert.equal(schemas.transactionSchema.safeParse({
    ...base,
    type: 'transfer',
    source: effect,
    destination: {
      ...effect, accountId: id(14), snapshotId: id(15), amount: 9,
    },
    effectiveRate: { baseCurrency: 'USD', quoteCurrency: 'EUR', rate: 0.9 },
  }).success, true);
  assert.equal(schemas.transactionSchema.safeParse({ ...scalar, type: 'transfer' }).success, false);
});

test('supports account and currency history filters', async () => {
  const schemas = await load('/src/entities/transactions/model/schemas.ts');
  assert.deepEqual(schemas.listTransactionsQuerySchema.parse({
    accountId: id(12), currency: 'USD', transactionType: 'transfer',
  }), { accountId: id(12), currency: 'USD', transactionType: 'transfer' });
});

test('snapshots validate account ids and nullable archived-account history responses', async () => {
  const schemas = await load('/src/entities/accounts-snapshots/model/schemas.ts');
  const snapshot = {
    _id: id(11), accountId: id(12), amount: 5, date: '2026-09-01',
  };

  assert.deepEqual(schemas.snapshotResponseSchema.parse(snapshot), snapshot);
  assert.equal(schemas.snapshotResponseSchema.parse(null), null);
  assert.equal(schemas.snapshotSchema.safeParse({ ...snapshot, accountId: 'archived-account' }).success, false);
});
