import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHistoricalBalance, loadCompleteLedger } from './budget-ledger.ts';

test('historical ledger applies one transfer side, opening date and KWD minor units', () => {
  const account = {
    _id: 'a', currency: 'KWD', openedAt: '2024-01-01', initialAmount: 0.001,
  };
  const rows = [
    {
      _id: '1', type: 'income', amount: 0.003, transactionDate: '2024-01-02',
    },
    {
      _id: '2', type: 'expense', amount: 0.005, transactionDate: '2024-01-03',
    },
    {
      _id: '3',
      type: 'transfer',
      source: { accountId: 'a', amount: 0.001 },
      destination: { accountId: 'b', amount: 10 },
      transactionDate: '2024-01-04',
    },
  ];
  assert.equal(calculateHistoricalBalance(account, rows, '2024-01-31'), -0.002);
  assert.equal(calculateHistoricalBalance(account, rows, '2023-12-31'), 0);
});
test('all pages must be complete and consistent, never a partial zero', async () => {
  const fetch = async ({ page }) => ({
    page, limit: 1, total: 2, items: [{ _id: String(page) }],
  });
  assert.equal((await loadCompleteLedger(fetch)).length, 2);
  await assert.rejects(loadCompleteLedger(async ({ page }) => ({
    page, limit: 1, total: 2, items: [{ _id: 'same' }],
  })));
});

test('ledger traverses more than 100 entries and rejects failures or changing totals', async () => {
  const calls = [];
  const fetch = async ({ page, limit }) => {
    calls.push(page);
    return {
      page,
      limit,
      total: 205,
      items: Array.from({ length: Math.min(limit, 205 - (page - 1) * limit) }, (_, offset) => ({
        _id: String((page - 1) * limit + offset),
      })),
    };
  };
  assert.equal((await loadCompleteLedger(fetch)).length, 205);
  assert.deepEqual(calls, [1, 2, 3]);
  await assert.rejects(loadCompleteLedger(async (pagination) => {
    if (pagination.page === 2) throw new Error('Intermediate page unavailable');
    return fetch(pagination);
  }), /Intermediate page/);
  await assert.rejects(loadCompleteLedger(async (pagination) => ({
    ...await fetch(pagination), total: pagination.page === 2 ? 204 : 205,
  })), /История изменилась/);
});
