import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./repay-debt-form.ts');

test('requires a matching account only for income-producing repayment', async () => {
  const model = await modelPromise;
  const accounts = [
    { _id: 'rub', currency: 'RUB', archivedAt: null },
    { _id: 'usd', currency: 'USD', archivedAt: null },
    { _id: 'old-usd', currency: 'USD', archivedAt: '2026-01-01' },
  ];

  assert.deepEqual(model.getEligibleDebtRepaymentAccounts(accounts, 'USD'), [accounts[1]]);
  assert.equal(model.getRepayDebtFormSchema(100).safeParse({
    accountId: '', repaymentDate: '2026-09-23', amount: '10', description: '', isIncome: true,
  }).success, false);
  assert.equal(model.getRepayDebtFormSchema(100).safeParse({
    accountId: '', repaymentDate: '2026-09-23', amount: '10', description: '', isIncome: false,
  }).success, true);
});

test('defaults to the first active balance account, then saving, in the debt currency', async () => {
  const { getRepayDebtFormValues } = await import('./repay-debt-form.ts');
  const debt = { currency: 'USD', remainingAmount: 80 };
  const accounts = [
    {
      _id: 'saving-1', type: 'saving', currency: 'USD', archivedAt: null,
    },
    {
      _id: 'rub', type: 'balance', currency: 'RUB', archivedAt: null,
    },
    {
      _id: 'archived', type: 'balance', currency: 'USD', archivedAt: '2026-01-01',
    },
    {
      _id: 'balance-1', type: 'balance', currency: 'USD', archivedAt: null,
    },
    {
      _id: 'balance-2', type: 'balance', currency: 'USD', archivedAt: null,
    },
  ];
  assert.equal(getRepayDebtFormValues(debt, accounts).accountId, 'balance-1');
  assert.equal(getRepayDebtFormValues(debt, accounts.slice(0, 3)).accountId, 'saving-1');
  assert.equal(getRepayDebtFormValues(debt, accounts.slice(1, 3)).accountId, '');
  assert.equal(getRepayDebtFormValues(debt).accountId, '');
  assert.equal(getRepayDebtFormValues(debt, accounts).amount, '80');
  assert.equal(getRepayDebtFormValues(debt, accounts).description, '');
  assert.equal(getRepayDebtFormValues(debt, accounts).isIncome, true);
});
