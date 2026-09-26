import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    return await server.ssrLoadModule('/src/entities/accounts/model/schemas.ts');
  } finally {
    await server.close();
  }
};

const account = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Основной счёт',
  type: 'balance',
  currency: 'RUB',
  initialAmount: 1000,
  openedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
  amount: 1250.5,
  timeline: [{
    _id: '507f191e810c19729de860ea',
    accountId: '507f1f77bcf86cd799439011',
    amount: 1250.5,
    date: '2026-09-23T00:00:00.000Z',
  }],
};

test('parses the named currency account response', async () => {
  const schemas = await loadSchemas();

  assert.deepEqual(schemas.accountSchema.parse(account), account);
  assert.equal(schemas.accountSchema.safeParse({ ...account, currency: 'ZZZ' }).success, false);
  assert.equal(schemas.accountSchema.safeParse({ ...account, name: undefined }).success, false);
});

test('validates account list filters', async () => {
  const schemas = await loadSchemas();

  assert.deepEqual(schemas.findAccountByQuerySchema.parse({
    type: 'saving',
    currency: 'USD',
    toDate: '2026-09-23',
  }), {
    type: 'saving',
    currency: 'USD',
    toDate: '2026-09-23',
  });
});

test('separates create and rename account payloads', async () => {
  const schemas = await loadSchemas();

  assert.deepEqual(schemas.createAccountSchema.parse({
    name: ' Доллары ',
    type: 'saving',
    currency: 'USD',
    amount: 25.5,
    openedAt: '2026-09-23',
  }), {
    name: 'Доллары',
    type: 'saving',
    currency: 'USD',
    amount: 25.5,
    openedAt: '2026-09-23',
  });
  assert.deepEqual(schemas.renameAccountSchema.parse({ name: ' Новый счёт ' }), {
    name: 'Новый счёт',
  });
  assert.equal(schemas.renameAccountSchema.safeParse({ name: '' }).success, false);
});
