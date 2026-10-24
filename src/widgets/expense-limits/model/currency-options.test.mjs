import assert from 'node:assert/strict';
import test from 'node:test';

test('currencies come from all existing account types and are unique in ISO order', async () => {
  const { getExpenseLimitCurrencies } = await import('./currency-options.ts');
  const available = getExpenseLimitCurrencies([
    { currency: 'USD', type: 'balance' }, { currency: 'RUB', type: 'saving' },
    { currency: 'USD', archivedAt: '2026-01-01' }, { currency: 'EUR', archivedAt: '2026-01-01' },
  ]);
  assert.deepEqual(available, ['EUR', 'RUB', 'USD']);
  assert.deepEqual(getExpenseLimitCurrencies([]), []);
});
