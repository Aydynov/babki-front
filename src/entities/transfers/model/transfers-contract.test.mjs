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
    return await server.ssrLoadModule('/src/entities/transfers/model/schemas.ts');
  } finally {
    await server.close();
  }
};

const objectId = (last) => `507f1f77bcf86cd7994390${last}`;
const effect = (last, currency, amount) => ({
  accountId: objectId(last),
  snapshotId: objectId(last + 2),
  currency,
  amount,
});

const transferFixture = {
  _id: objectId(11),
  type: 'transfer',
  transactionDate: '2026-09-23T12:00:00.000Z',
  description: 'Обмен',
  source: effect(12, 'RUB', 9000),
  destination: effect(13, 'USD', 100),
  effectiveRate: {
    baseCurrency: 'RUB',
    quoteCurrency: 'USD',
    rate: 1 / 90,
  },
};

test('parses paired transfer effects and directed effective rate', async () => {
  const schemas = await loadSchemas();

  assert.equal(schemas.transferSchema?.safeParse(transferFixture).success, true);
  assert.equal(schemas.transferSchema?.safeParse({
    ...transferFixture,
    effectiveRate: { ...transferFixture.effectiveRate, baseCurrency: undefined },
  }).success, false);
  assert.equal(schemas.transferSchema?.safeParse({
    ...transferFixture,
    accountId: transferFixture.source.accountId,
    amount: 9000,
  }).success, true, 'extra legacy scalar fields must not replace paired effects');
});

test('validates pagination/account filters and immutable update fields', async () => {
  const schemas = await loadSchemas();

  assert.equal(schemas.listTransfersQuerySchema?.safeParse({
    page: 2,
    limit: 20,
    accountId: transferFixture.source.accountId,
    currency: 'RUB',
  }).success, true);
  assert.equal(schemas.createTransferSchema?.safeParse({
    sourceAccountId: transferFixture.source.accountId,
    destinationAccountId: transferFixture.destination.accountId,
    sourceAmount: 9000,
    destinationAmount: 100,
    transactionDate: '2026-09-23',
    description: 'Обмен',
  }).success, true);
  const update = schemas.updateTransferSchema?.parse({
    sourceAmount: 8000,
    destinationAmount: 90,
    sourceAccountId: transferFixture.source.accountId,
    transactionDate: '2026-09-24',
  });
  assert.deepEqual(update, { sourceAmount: 8000, destinationAmount: 90 });
});

test('enforces strict equal amounts for same-currency transfer payloads', async () => {
  const schemas = await loadSchemas();
  const sameCurrency = {
    sourceAccountId: transferFixture.source.accountId,
    destinationAccountId: transferFixture.destination.accountId,
    sourceAmount: 100,
    destinationAmount: 100,
    transactionDate: '2026-09-23',
  };

  assert.equal(typeof schemas.hasValidSameCurrencyTransferAmounts, 'function');
  assert.equal(schemas.hasValidSameCurrencyTransferAmounts?.(sameCurrency, 'RUB', 'RUB'), true);
  assert.equal(schemas.hasValidSameCurrencyTransferAmounts?.({
    ...sameCurrency,
    destinationAmount: 100.01,
  }, 'RUB', 'RUB'), false);
  assert.equal(schemas.hasValidSameCurrencyTransferAmounts?.({
    ...sameCurrency,
    destinationAmount: 1,
  }, 'RUB', 'USD'), true);
  assert.equal(schemas.transferSchema?.safeParse({
    ...transferFixture,
    source: { ...transferFixture.source, currency: 'RUB', amount: 100 },
    destination: { ...transferFixture.destination, currency: 'RUB', amount: 99 },
    effectiveRate: { baseCurrency: 'RUB', quoteCurrency: 'RUB', rate: 0.99 },
  }).success, false);
});
