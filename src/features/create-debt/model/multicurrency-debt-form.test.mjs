import assert from 'node:assert/strict';
import test from 'node:test';

const createPromise = import('./create-debt-form.ts').catch(() => ({}));

test('validates debt creation precision in the chosen currency', async () => {
  const model = await createPromise;

  assert.equal(model.hasValidDebtAmountPrecision?.('100', 'JPY'), true);
  assert.equal(model.hasValidDebtAmountPrecision?.('100.5', 'JPY'), false);
  assert.equal(model.defaultCreateDebtFormValues?.currency, 'RUB');
});
