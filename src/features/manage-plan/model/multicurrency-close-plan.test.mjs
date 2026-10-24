import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Catches choosing a saving/archived/foreign-currency account ahead of an eligible balance account.
test('execution defaults prefer balance, fall back to saving, and preserve API order', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const model = await server.ssrLoadModule('/src/features/manage-plan/model/execute-plan-form.ts');
    const plan = { amount: 120, currency: 'USD', description: 'Покупка' };
    const accounts = [
      {
        _id: 'rub', type: 'balance', currency: 'RUB', archivedAt: null,
      },
      {
        _id: 'archived', type: 'balance', currency: 'USD', archivedAt: '2026-09-01',
      },
      {
        _id: 'saving-first', type: 'saving', currency: 'USD', archivedAt: null,
      },
      {
        _id: 'balance-first', type: 'balance', currency: 'USD', archivedAt: null,
      },
      {
        _id: 'balance-second', type: 'balance', currency: 'USD', archivedAt: null,
      },
      {
        _id: 'saving-second', type: 'saving', currency: 'USD', archivedAt: null,
      },
    ];
    assert.equal(model.getExecutePlanFormValues(plan, accounts).accountId, 'balance-first');
    assert.equal(
      model.getExecutePlanFormValues(plan, accounts.filter((a) => a.type !== 'balance')).accountId,
      'saving-first',
    );
    assert.equal(model.getExecutePlanFormValues(plan, accounts.slice(0, 2)).accountId, '');
    assert.equal(model.getExecutePlanFormValues(plan, []).accountId, '');
    assert.deepEqual(
      model.getEligiblePlanAccounts(accounts, 'USD').map((a) => a._id),
      ['saving-first', 'balance-first', 'balance-second', 'saving-second'],
    );
    const defaults = model.getExecutePlanFormValues(plan, accounts);
    assert.equal(defaults.amount, '120');
    assert.equal(defaults.description, 'Покупка');
    assert.equal(defaults.participantId, '');
    assert.match(defaults.closingDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(model.executePlanFormSchema.safeParse({ ...defaults, accountId: '' }).success, false);
    assert.equal(model.executePlanFormSchema.safeParse(defaults).success, true);
  } finally {
    await server.close();
  }
});
