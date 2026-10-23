import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./create-income-form.ts').catch(() => ({}));

const activeAccount = {
  _id: '507f1f77bcf86cd799439011',
  archivedAt: null,
  currency: 'RUB',
  type: 'balance',
};

test('requires an account and maps it into the create request', async () => {
  const model = await modelPromise;
  const values = {
    accountId: activeAccount._id,
    description: '  Зарплата  ',
    amount: '1000.50',
    transactionDate: '2026-09-23',
  };

  assert.equal(model.createIncomeFormSchema?.safeParse(values).success, true);
  assert.deepEqual(model.mapCreateIncomeDto?.(values), {
    accountId: activeAccount._id,
    description: 'Зарплата',
    amount: 1000.5,
    transactionDate: '2026-09-23',
  });
  assert.equal(model.createIncomeFormSchema?.safeParse({ ...values, accountId: '' }).success, false);
});

test('starts with an empty account until accounts are available', async () => {
  const model = await modelPromise;
  assert.equal(model.getDefaultCreateIncomeFormValues().accountId, '');
});

test('validates income amount precision for the selected account currency', async () => {
  const model = await modelPromise;

  assert.equal(typeof model.hasValidIncomeAmountPrecision, 'function');
  assert.equal(model.hasValidIncomeAmountPrecision?.('100.25', 'RUB'), true);
  assert.equal(model.hasValidIncomeAmountPrecision?.('100.251', 'RUB'), false);
  assert.equal(model.hasValidIncomeAmountPrecision?.('100', 'JPY'), true);
  assert.equal(model.hasValidIncomeAmountPrecision?.('100.5', 'JPY'), false);
});

test('starts with an empty account when no usable default exists', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.getDefaultCreateIncomeFormValues?.(), {
    accountId: '',
    description: '',
    amount: '',
    transactionDate: '',
  });
});

test('income eligibility allows saving and filters only active selected-currency accounts', async () => {
  const model = await modelPromise;
  const saving = { ...activeAccount, _id: 'saving', type: 'saving' };
  const usd = { ...activeAccount, _id: 'usd', currency: 'USD' };
  const accounts = [activeAccount, saving, usd, { ...activeAccount, archivedAt: '2026-10-01' }];
  assert.deepEqual(model.getIncomeAccounts(accounts, 'RUB'), [activeAccount, saving]);
  assert.deepEqual(model.getIncomeAccounts(accounts), [activeAccount, saving, usd]);
});

test('requires a valid income date before submission', async () => {
  const model = await modelPromise;
  const values = {
    accountId: activeAccount._id, description: '', amount: '1', transactionDate: '',
  };
  assert.equal(model.createIncomeFormSchema.safeParse(values).success, false);
  assert.equal(model.createIncomeFormSchema.safeParse({ ...values, transactionDate: 'not-a-date' }).success, false);
  assert.equal(model.createIncomeFormSchema.safeParse({ ...values, transactionDate: '2026-10-22' }).success, true);
});

test('defaults to the active balance account in the selected currency', async () => {
  const model = await modelPromise;
  const saving = { ...activeAccount, _id: 'saving', type: 'saving' };
  const usd = { ...activeAccount, _id: 'usd', currency: 'USD' };
  const archived = { ...activeAccount, _id: 'archived', archivedAt: '2026-10-01' };
  const accounts = [saving, usd, archived, activeAccount];

  assert.equal(model.getDefaultCreateIncomeFormValues(accounts, 'RUB').accountId, activeAccount._id);
  assert.equal(model.getDefaultCreateIncomeFormValues(accounts, 'USD').accountId, usd._id);
  assert.equal(model.getDefaultCreateIncomeFormValues(accounts, 'EUR').accountId, '');
  assert.equal(model.getDefaultCreateIncomeFormValues([saving, archived], 'RUB').accountId, '');
});
