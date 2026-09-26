import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./create-income-form.ts').catch(() => ({}));

const activeAccount = {
  _id: '507f1f77bcf86cd799439011',
  archivedAt: null,
  currency: 'RUB',
};

test('requires an account and maps it into the create request', async () => {
  const model = await modelPromise;
  const values = {
    accountId: activeAccount._id,
    source: '  Зарплата  ',
    amount: '1000.50',
    transactionDate: '2026-09-23',
  };

  assert.equal(model.createIncomeFormSchema?.safeParse(values).success, true);
  assert.deepEqual(model.mapCreateIncomeDto?.(values), {
    accountId: activeAccount._id,
    source: 'Зарплата',
    amount: 1000.5,
    transactionDate: '2026-09-23',
  });
  assert.equal(model.createIncomeFormSchema?.safeParse({ ...values, accountId: '' }).success, false);
});

test('preselects only a loaded active default account', async () => {
  const model = await modelPromise;
  const archivedAccount = {
    ...activeAccount,
    _id: '507f1f77bcf86cd799439012',
    archivedAt: '2026-09-01T00:00:00.000Z',
  };

  assert.equal(typeof model.getIncomeInitialAccountId, 'function');
  assert.equal(
    model.getIncomeInitialAccountId?.([activeAccount, archivedAccount], activeAccount._id),
    activeAccount._id,
  );
  assert.equal(
    model.getIncomeInitialAccountId?.([activeAccount, archivedAccount], archivedAccount._id),
    '',
  );
  assert.equal(model.getIncomeInitialAccountId?.([activeAccount], null), '');
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
    source: '',
    amount: '',
    transactionDate: '',
  });
});
