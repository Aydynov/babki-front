import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./execute-plan-form.ts').catch(() => ({}));

test('plan closure offers only active matching-currency accounts and requires selection', async () => {
  const model = await modelPromise;
  const accounts = [
    { _id: 'rub', currency: 'RUB', archivedAt: null },
    { _id: 'usd', currency: 'USD', archivedAt: null },
    { _id: 'archived', currency: 'USD', archivedAt: '2026-09-01' },
  ];

  assert.deepEqual(model.getEligiblePlanAccounts?.(accounts, 'USD'), [accounts[1]]);
  assert.equal(model.executePlanFormSchema?.safeParse({
    accountId: '', closingDate: '2026-09-23', amount: '10', description: 'Покупка',
  }).success, false);
});
