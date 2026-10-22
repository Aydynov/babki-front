import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('space contracts preserve identity and actors without personal userId or server counters', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const plans = await server.ssrLoadModule('/src/entities/plans/model/schemas.ts');
    const debts = await server.ssrLoadModule('/src/entities/debts/model/schemas.ts');
    const history = await server.ssrLoadModule('/src/entities/debt-transactions/model/schemas.ts');
    const id = '507f1f77bcf86cd799439011';
    const base = {
      _id: id,
      spaceId: id,
      createdBy: id,
      createdByActor: {
        userId: id, firstName: null, lastName: null, isAnonymized: true,
      },
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      archivedAt: null,
    };
    const plan = plans.planSchema.parse({
      ...base,
      description: 'Покупка',
      targetDate: '2026-11-01',
      amount: 0.001,
      currency: 'KWD',
      categoryId: id,
      status: 'active',
    });
    assert.equal(plan.spaceId, id);
    assert.equal('userId' in plan, false);
    const debt = debts.debtSchema.parse({
      ...base,
      debtor: 'Друг',
      principalAmount: 200,
      remainingAmount: 140,
      currency: 'USD',
      dueDate: null,
      status: 'active',
    });
    assert.equal(debt.dueDate, null);
    assert.deepEqual(
      debts.createDebtSchema.parse({
        debtor: 'Друг',
        principalAmount: 200,
        currency: 'USD',
        remainingAmount: 10,
        status: 'closed',
      }),
      { debtor: 'Друг', principalAmount: 200, currency: 'USD' },
    );
    assert.equal(debts.repayDebtSchema.safeParse({ amount: 60, repaymentDate: '2026-10-01' }).success, false);
    assert.equal(debts.repayDebtSchema.safeParse({
      amount: 60,
      repaymentDate: '2026-10-01',
      isIncome: false,
      accountId: id,
    }).success, false);
    const repayment = history.debtTransactionSchema.parse({
      ...base,
      debtId: id,
      amount: 60,
      transactionDate: '2026-10-01',
      isIncome: false,
      cancelledAt: null,
      description: '',
    });
    assert.equal(repayment.cancelledAt, null);
  } finally {
    await server.close();
  }
});
