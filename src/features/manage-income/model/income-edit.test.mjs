import assert from 'node:assert/strict';
import test from 'node:test';
import { getIncomeEditPatch, recoverMissingIncome } from './income-edit.ts';

test('metadata-only edits do not send the opening amount back over a concurrent amount change', () => {
  const baseline = { amount: 100, description: 'Original' };
  assert.deepEqual(getIncomeEditPatch({ amount: '100', description: ' Updated ' }, baseline), {
    description: 'Updated',
  });
  assert.deepEqual(getIncomeEditPatch({ amount: '100.00', description: 'Original' }, baseline), {});
  assert.deepEqual(getIncomeEditPatch({ amount: '125', description: '' }, baseline), {
    amount: 125, description: '',
  });
});

test('missing-income recovery closes the editor and refreshes only its caller-supplied budget', async () => {
  const actions = [];
  const dependencies = {
    close: () => actions.push('close'),
    notify: () => actions.push('notify'),
    refresh: async () => {
      actions.push('refresh-captured-budget');
    },
  };
  assert.equal(await recoverMissingIncome({ response: { status: 404 } }, dependencies), true);
  assert.deepEqual(actions, ['close', 'notify', 'refresh-captured-budget']);
  actions.length = 0;
  assert.equal(await recoverMissingIncome({ response: { status: 503 } }, dependencies), false);
  assert.deepEqual(actions, []);
});

test('refresh failure does not reopen a known-missing income for another mutation attempt', async () => {
  let closed = false;
  const recovered = await recoverMissingIncome({ response: { status: 404 } }, {
    close: () => {
      closed = true;
    },
    notify: () => {},
    refresh: async () => {
      throw new Error('offline');
    },
  });
  assert.equal(recovered, true);
  assert.equal(closed, true);
});
