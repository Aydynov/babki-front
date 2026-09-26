import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./account-form.ts').catch(() => ({}));

test('maps account form values to the create DTO', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.buildCreateAccountPayload?.({
    name: '  Основной ',
    type: 'balance',
    currency: 'RUB',
    amount: '1250.50',
    openedAt: '2026-09-23',
  }), {
    name: 'Основной',
    type: 'balance',
    currency: 'RUB',
    amount: 1250.5,
    openedAt: '2026-09-23',
  });
});

test('derives the opening date from local calendar components', async () => {
  const model = await modelPromise;
  const localDate = new Date(2026, 8, 26, 1, 30);

  assert.equal(model.getLocalDateString?.(localDate), '2026-09-26');
});

test('distinguishes restricted deletion from generic account errors', async () => {
  const model = await modelPromise;

  assert.equal(model.getAccountMutationErrorKey?.({ response: { status: 409 } }), 'restricted');
  assert.equal(model.getAccountMutationErrorKey?.({ response: { status: 400 } }), 'validation');
  assert.equal(model.getAccountMutationErrorKey?.({ response: { status: 500 } }), 'generic');
});
