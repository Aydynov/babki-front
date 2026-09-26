import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./repay-debt-form.ts').catch(() => ({}));

test('requires a matching account only for income-producing repayment', async () => {
  const model = await modelPromise;
  const accounts = [
    { _id: 'rub', currency: 'RUB', archivedAt: null },
    { _id: 'usd', currency: 'USD', archivedAt: null },
    { _id: 'old-usd', currency: 'USD', archivedAt: '2026-01-01' },
  ];

  assert.deepEqual(model.getEligibleDebtRepaymentAccounts?.(accounts, 'USD'), [accounts[1]]);
  assert.equal(model.getRepayDebtFormSchema?.(100).safeParse({
    accountId: '', repaymentDate: '2026-09-23', amount: '10', description: '', isIncome: true,
  }).success, false);
  assert.equal(model.getRepayDebtFormSchema?.(100).safeParse({
    accountId: '', repaymentDate: '2026-09-23', amount: '10', description: '', isIncome: false,
  }).success, true);
});
