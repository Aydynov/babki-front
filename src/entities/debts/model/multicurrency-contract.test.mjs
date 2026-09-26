import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule('/src/entities/debts/model/schemas.ts');
  } finally {
    await server.close();
  }
};

test('debts carry immutable currency and enforce conditional repayment account', async () => {
  const schemas = await loadSchemas();
  const accountId = '507f1f77bcf86cd799439012';
  const create = {
    debtor: 'Иван',
    principalAmount: 100,
    remainingAmount: 100,
    currency: 'USD',
  };

  assert.deepEqual(schemas.createDebtSchema.parse(create), create);
  assert.deepEqual(schemas.updateDebtSchema.parse({ remainingAmount: 50, currency: 'RUB' }), {
    remainingAmount: 50,
  });
  assert.deepEqual(schemas.listDebtsQuerySchema.parse({ status: 'active', currency: 'USD' }), {
    status: 'active',
    currency: 'USD',
  });
  assert.equal(schemas.repayDebtSchema.safeParse({
    repaymentDate: '2026-09-23', amount: 10, isIncome: true,
  }).success, false);
  assert.equal(schemas.repayDebtSchema.safeParse({
    repaymentDate: '2026-09-23', amount: 10, isIncome: true, accountId,
  }).success, true);
  assert.equal(schemas.repayDebtSchema.safeParse({
    repaymentDate: '2026-09-23', amount: 10, isIncome: false,
  }).success, true);
});
