import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Focused executable contract check: node --test src/entities/accounts/model/space-contract.test.mjs
// Fixtures follow backend space-finances DTOs; no network or backend mutations are performed.
test('space financial DTOs retain ownership and actors and strip immutable request fields', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  const load = (name) => server.ssrLoadModule(`/src/entities/${name}/model/schemas.ts`);
  try {
    const id = 'a'.repeat(24);
    const actor = {
      userId: id, firstName: null, lastName: null, isAnonymized: true,
    };
    const transaction = {
      _id: id,
      spaceId: id,
      createdBy: id,
      createdByActor: actor,
      accountId: id,
      snapshotId: id,
      type: 'income',
      currency: 'RUB',
      amount: 1,
      transactionDate: '2026-01-01T00:00:00Z',
      origin: null,
    };
    const incomes = await load('incomes');
    assert.deepEqual(incomes.incomeSchema.parse(transaction), transaction);
    assert.equal(incomes.incomeSchema.safeParse({ ...transaction, createdByActor: undefined }).success, false);
    assert.deepEqual(incomes.updateIncomeSchema.parse({ amount: 2, accountId: id, source: 'old' }), { amount: 2 });
    const expenses = await load('expenses');
    assert.equal(expenses.createExpenseSchema.parse({
      accountId: id,
      categoryId: id,
      participantId: id,
      amount: 2,
      transactionDate: '2026-01-01',
      ownerType: 'group',
    }).participantId, id);
    const debts = await load('debts');
    assert.deepEqual(debts.createDebtSchema.parse({
      debtor: 'Имя', principalAmount: 1, currency: 'RUB', remainingAmount: 0, status: 'closed',
    }), { debtor: 'Имя', principalAmount: 1, currency: 'RUB' });
    assert.equal(debts.repayDebtSchema.safeParse({ amount: 1, repaymentDate: '2026-01-01' }).success, false);
    assert.equal(debts.repayDebtSchema.safeParse({
      amount: 1, repaymentDate: '2026-01-01', isIncome: true,
    }).success, false);
    assert.equal(debts.repayDebtSchema.safeParse({
      amount: 1, repaymentDate: '2026-01-01', isIncome: false, accountId: id,
    }).success, false);
    assert.deepEqual(debts.updateDebtSchema.parse({ dueDate: null, status: 'closed' }), { dueDate: null });
    assert.equal(debts.createDebtSchema.safeParse({
      debtor: 'Имя', principalAmount: 1, currency: 'RUB', dueDate: null,
    }).success, false);
    const accounts = await load('accounts');
    assert.equal(accounts.accountSchema.parse({
      _id: id,
      spaceId: id,
      name: 'Счёт',
      amount: -1,
      initialAmount: 0,
      currency: 'RUB',
      openedAt: '2026-01-01',
      archivedAt: null,
      type: 'saving',
      timeline: [{
        _id: id, accountId: id, amount: -1, date: '2026-01-01',
      }],
    }).amount, -1);
    const plans = await load('plans');
    assert.deepEqual(plans.closePlanPayloadSchema.parse({
      accountId: id, participantId: id, currency: 'USD', createdBy: id,
    }), { accountId: id, participantId: id });
  } finally {
    await server.close();
  }
});

test('accepts positive three-decimal plan and debt money before currency precision validation', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const plans = await server.ssrLoadModule('/src/entities/plans/model/schemas.ts');
    const debts = await server.ssrLoadModule('/src/entities/debts/model/schemas.ts');
    const id = 'a'.repeat(24);
    assert.equal(plans.createPlanPayloadSchema.safeParse({
      currency: 'KWD', description: 'План', targetDate: '2026-12-01', amount: 0.001, categoryId: id,
    }).success, true);
    assert.equal(plans.closePlanPayloadSchema.safeParse({ accountId: id, amount: 0.001 }).success, true);
    assert.equal(debts.createDebtSchema.safeParse({
      debtor: 'Друг', principalAmount: 0.001, currency: 'KWD',
    }).success, true);
    assert.equal(debts.repayDebtSchema.safeParse({
      amount: 0.001, repaymentDate: '2026-11-01', isIncome: false,
    }).success, true);
  } finally {
    await server.close();
  }
});
