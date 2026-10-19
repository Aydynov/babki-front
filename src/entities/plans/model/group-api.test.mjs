import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('group plan/debt requests and cache keys remain bound to the original budget', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { plansApi } = await server.ssrLoadModule('/src/entities/plans/api/plans.api.ts');
    const { debtsApi } = await server.ssrLoadModule('/src/entities/debts/api/debts.api.ts');
    const { debtTransactionsApi } = await server.ssrLoadModule(
      '/src/entities/debt-transactions/api/debt-transactions.api.ts',
    );
    const { plansQueryOptions } = await server.ssrLoadModule('/src/entities/plans/api/plans.query.ts');
    const id = '507f1f77bcf86cd799439011';
    const other = '507f1f77bcf86cd799439012';
    const scope = { kind: 'group', userId: other, groupId: id };
    const actor = {
      userId: other, firstName: null, lastName: null, isAnonymized: true,
    };
    const base = {
      _id: id,
      ownerType: 'group',
      ownerId: id,
      createdBy: other,
      createdByActor: actor,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      archivedAt: null,
    };
    const debt = {
      ...base,
      debtor: 'Друг',
      principalAmount: 200,
      remainingAmount: 140,
      currency: 'USD',
      status: 'active',
      dueDate: null,
    };
    const repayment = {
      ...base,
      debtId: id,
      amount: 60,
      transactionDate: '2026-10-01',
      isIncome: false,
      cancelledAt: null,
      description: '',
    };
    const plan = {
      ...base,
      description: 'Покупка',
      targetDate: '2026-11-01',
      amount: 100,
      currency: 'USD',
      categoryId: id,
      status: 'closed',
      expenseId: other,
    };
    const calls = [];
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => {
      calls.push(config);
      const data = config.url.endsWith('/close') ? plan
        : config.url.endsWith('/cancel') || (config.method === 'post' && config.url.endsWith('/repayments'))
          ? { debt, repayment }
          : config.url.endsWith('/repayments') || config.url.endsWith('/transactions')
            ? {
              items: [repayment], total: 1, page: 1, limit: 10,
            } : debt;
      return {
        data, status: 200, statusText: 'OK', headers: {}, config,
      };
    };
    try {
      const result = await plansApi.close(id, { accountId: other, amount: 120, participantId: id }, scope);
      assert.equal(result.amount, 100);
      assert.equal(calls.at(-1).url, `/groups/${id}/plans/${id}/close`);
      assert.deepEqual(JSON.parse(calls.at(-1).data), { accountId: other, amount: 120 });
      await debtsApi.create({
        debtor: 'Друг',
        principalAmount: 200,
        currency: 'USD',
        remainingAmount: 12,
        status: 'closed',
      }, scope);
      assert.deepEqual(JSON.parse(calls.at(-1).data), { debtor: 'Друг', principalAmount: 200, currency: 'USD' });
      const paid = await debtsApi.repay(id, { amount: 60, repaymentDate: '2026-10-01', isIncome: false }, scope);
      assert.equal(paid.debt.remainingAmount, 140);
      assert.equal(paid.repayment.isIncome, false);
      assert.equal('accountId' in JSON.parse(calls.at(-1).data), false);
      await debtTransactionsApi.findAll(id, { page: 2, limit: 10 }, undefined, scope);
      assert.equal(calls.at(-1).url, `/groups/${id}/debts/${id}/repayments`);
      assert.equal(calls.at(-1).params.page, 2);
      await debtsApi.cancelRepayment(id, other, scope);
      assert.equal(calls.at(-1).url, `/groups/${id}/debts/${id}/repayments/${other}/cancel`);
      const first = plansQueryOptions.findAll({ page: 2 }, scope);
      const second = plansQueryOptions.findAll({ page: 2 }, { ...scope, groupId: other });
      const personal = plansQueryOptions.findAll({ page: 2 }, { kind: 'personal', userId: other });
      assert.notDeepEqual(first.queryKey, second.queryKey);
      assert.notDeepEqual(first.queryKey, personal.queryKey);
      assert.deepEqual(first.queryKey.slice(0, 4), ['plans', other, 'group', id]);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  } finally {
    await server.close();
  }
});

test('personal plan/debt list requests omit group-only archive filters while group requests retain them', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { plansApi } = await server.ssrLoadModule('/src/entities/plans/api/plans.api.ts');
    const { debtsApi } = await server.ssrLoadModule('/src/entities/debts/api/debts.api.ts');
    const originalAdapter = apiClient.defaults.adapter;
    const calls = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push(config);
      if (!config.url.startsWith('/groups/') && Object.hasOwn(config.params, 'includeArchived')) {
        throw new Error('Personal API rejects unknown includeArchived query parameter');
      }
      return {
        data: {
          items: [], total: 0, page: 1, limit: 5,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    try {
      const userId = '507f1f77bcf86cd799439011';
      const personal = { kind: 'personal', userId };
      const group = { kind: 'group', userId, groupId: '507f1f77bcf86cd799439012' };
      const cases = [plansApi, debtsApi].flatMap((api) => [undefined, personal, group].flatMap((scope) => (
        [false, true].map((includeArchived) => ({ api, scope, includeArchived }))
      )));
      await cases.reduce(async (previous, { api, scope, includeArchived }) => {
        await previous;
        await api.findAll({
          status: 'active', currency: 'USD', page: 1, limit: 5, includeArchived,
        }, undefined, scope);
        const expected = {
          status: 'active', currency: 'USD', page: 1, limit: 5,
        };
        assert.deepEqual(calls.at(-1).params, scope?.kind === 'group' ? { ...expected, includeArchived } : expected);
        assert.equal(calls.at(-1).url.startsWith('/groups/'), scope?.kind === 'group');
      }, Promise.resolve());
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  } finally {
    await server.close();
  }
});
