// Run: node --test src/widgets/accounts/model/account-presentation.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { groupAccounts, getTransferEffects } from './account-presentation.ts';

const account = (_id, type, currency, name, archivedAt = null) => ({
  _id, type, currency, name, archivedAt,
});

test('groups active accounts by type, ISO, localized name and id without mutating input', () => {
  const accounts = [
    account('rub', 'balance', 'RUB', 'А'),
    account('saving', 'saving', 'USD', 'А'),
    account('b', 'balance', 'USD', 'Б'),
    account('a2', 'balance', 'USD', 'А'),
    account('eur', 'balance', 'EUR', 'А'),
    account('a1', 'balance', 'USD', 'А'),
    account('archive', 'balance', 'USD', 'А', '2026-10-01'),
  ];
  const original = [...accounts];
  assert.deepEqual(groupAccounts(accounts, 'ru').map(({ type, accounts: items }) => (
    [type, items.map(({ _id }) => _id)]
  )), [['balance', ['eur', 'rub', 'a1', 'a2', 'b']], ['saving', ['saving']]]);
  assert.deepEqual(accounts, original);
});

test('omits empty groups and returns no groups when every account is archived', () => {
  assert.deepEqual(groupAccounts([], 'ru'), []);
  assert.deepEqual(groupAccounts([account('a', 'balance', 'USD', 'A', '2026-10-01')], 'ru'), []);
  assert.deepEqual(groupAccounts([account('s', 'saving', 'USD', 'A')], 'ru')
    .map(({ type }) => type), ['saving']);
});

const transfer = (_id, transactionDate, destinationCurrency = 'USD', destinationAmount = 100) => ({
  _id,
  transactionDate,
  source: { accountId: 'source', amount: 9000, currency: 'RUB' },
  destination: { accountId: 'destination', amount: destinationAmount, currency: destinationCurrency },
});

test('projects outgoing and incoming effects with their actual amounts and currencies', () => {
  const item = transfer('1', '2026-10-10');
  assert.deepEqual(getTransferEffects([item], 'source'), [{
    _id: '1',
    transactionDate: '2026-10-10',
    amount: -9000,
    currency: 'RUB',
    counterpartyId: 'destination',
  }]);
  assert.deepEqual(getTransferEffects([item], 'destination'), [{
    _id: '1',
    transactionDate: '2026-10-10',
    amount: 100,
    currency: 'USD',
    counterpartyId: 'source',
  }]);
  const sameCurrency = transfer('2', '2026-10-11', 'RUB', 9000);
  assert.equal(getTransferEffects([sameCurrency], 'source')[0].amount, -9000);
  assert.equal(getTransferEffects([sameCurrency], 'destination')[0].amount, 9000);
  assert.equal(getTransferEffects([sameCurrency], 'destination')[0].currency, 'RUB');
});

test('sorts newest first with stable ids and preserves counterparty ids regardless of archive status', () => {
  const items = [transfer('a', '2026-10-01'), transfer('b', '2026-10-12'), transfer('c', '2026-10-12')];
  const original = [...items];
  assert.deepEqual(getTransferEffects(items, 'source').map(({ _id }) => _id), ['c', 'b', 'a']);
  assert.equal(getTransferEffects(items, 'destination')[0].counterpartyId, 'source');
  assert.deepEqual(getTransferEffects(items, 'unrelated'), []);
  assert.deepEqual(items, original);
});

test('archive mode excludes active accounts and preserves grouping and ordering without mutation', () => {
  const accounts = [
    account('active', 'balance', 'USD', 'А'),
    account('rub', 'balance', 'RUB', 'А', '2026-10-01'),
    account('b', 'balance', 'USD', 'Б', '2026-10-01'),
    account('a2', 'balance', 'USD', 'А', '2026-10-01'),
    account('a1', 'balance', 'USD', 'А', '2026-10-01'),
    account('saving', 'saving', 'EUR', 'А', '2026-10-01'),
  ];
  const original = [...accounts];
  assert.deepEqual(
    groupAccounts(accounts, 'ru', 'archived')
      .map(({ type, accounts: items }) => [type, items.map(({ _id }) => _id)]),
    [['balance', ['rub', 'a1', 'a2', 'b']], ['saving', ['saving']]],
  );
  assert.deepEqual(accounts, original);
  assert.deepEqual(groupAccounts([], 'ru', 'archived'), []);
  assert.deepEqual(groupAccounts([accounts[0]], 'ru', 'archived'), []);
});
