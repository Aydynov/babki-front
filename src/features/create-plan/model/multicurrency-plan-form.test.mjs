import assert from 'node:assert/strict';
import test from 'node:test';

const createPromise = import('./create-plan-form.ts').catch(() => ({}));

test('creates plans with explicit currency precision', async () => {
  const model = await createPromise;
  const values = { ...model.defaultCreatePlanFormValues, currency: 'JPY', amount: '100' };

  assert.equal(model.createPlanFormSchema?.safeParse(values).success, false, 'other required fields stay required');
  assert.equal(model.hasValidPlanAmountPrecision?.('100', 'JPY'), true);
  assert.equal(model.hasValidPlanAmountPrecision?.('100.5', 'JPY'), false);
});
