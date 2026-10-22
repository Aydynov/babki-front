/* eslint-disable no-restricted-syntax, no-await-in-loop -- Sequential assertions share transport state. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Run explicitly: node --test src/entities/plans/model/group-api.test.mjs
// Axios adapter simulation only; fixture fields follow backend space-finances DTOs and response schemas.
test('space lifecycle requests use strict DTOs, repayment envelopes, scoped keys, and 204 archives', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const load = (path) => server.ssrLoadModule(`/src/${path}`);
    const { apiClient } = await load('shared/api/index.ts');
    const { plansApi } = await load('entities/plans/api/plans.api.ts');
    const { debtsApi } = await load('entities/debts/api/debts.api.ts');
    const { debtTransactionsApi } = await load('entities/debt-transactions/api/debt-transactions.api.ts');
    const { plansQueryOptions } = await load('entities/plans/api/plans.query.ts');
    const { transactionsApi } = await load('entities/transactions/api/transactions.api.ts');
    const id = 'a'.repeat(24);
    const other = 'b'.repeat(24);
    const scope = { userId: other, spaceId: id };
    const actor = {
      userId: other, firstName: null, lastName: null, isAnonymized: true,
    };
    const base = {
      _id: id,
      spaceId: id,
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
      const empty = config.method === 'delete' || config.url.endsWith('/archive');
      let data;
      if (config.url.endsWith('/close')) data = plan;
      else if (config.url.endsWith('/cancel') || (config.method === 'post' && config.url.endsWith('/repayments'))) {
        data = { debt, repayment };
      } else if (config.method === 'get') {
        data = {
          items: [], total: 0, page: 1, limit: 10,
        };
      } else data = debt;
      return {
        data: empty ? '' : data, status: empty ? 204 : 200, statusText: 'OK', headers: {}, config,
      };
    };
    try {
      const result = await plansApi.close(id, { accountId: other, amount: 120, participantId: id }, scope);
      assert.equal(result.amount, 100);
      assert.equal(calls.at(-1).url, `/spaces/${id}/plans/${id}/close`);
      assert.deepEqual(JSON.parse(calls.at(-1).data), { accountId: other, amount: 120, participantId: id });
      await debtsApi.create({
        debtor: 'Друг', principalAmount: 200, currency: 'USD', remainingAmount: 12, status: 'closed',
      }, scope);
      assert.deepEqual(JSON.parse(calls.at(-1).data), { debtor: 'Друг', principalAmount: 200, currency: 'USD' });
      const paid = await debtsApi.repay(id, { amount: 60, repaymentDate: '2026-10-01', isIncome: false }, scope);
      assert.equal(paid.debt.remainingAmount, 140);
      assert.equal(paid.repayment.isIncome, false);
      assert.equal('accountId' in JSON.parse(calls.at(-1).data), false);
      await debtTransactionsApi.findAll(id, { page: 2, limit: 10 }, undefined, scope);
      assert.equal(calls.at(-1).url, `/spaces/${id}/debts/${id}/repayments`);
      assert.equal(calls.at(-1).params.page, 2);
      await debtsApi.cancelRepayment(id, other, scope);
      assert.equal(calls.at(-1).url, `/spaces/${id}/debts/${id}/repayments/${other}/cancel`);
      assert.equal(calls.at(-1).data, undefined);
      assert.equal(calls.at(-1).params, undefined);
      for (const api of [plansApi, debtsApi]) {
        for (const includeArchived of [false, true]) {
          await api.findAll({ includeArchived }, undefined, scope);
          assert.equal(calls.at(-1).params.includeArchived, String(includeArchived));
        }
        assert.equal(await api.archive(id, scope), undefined);
      }
      for (const type of ['income', 'expense', 'transfer']) {
        await transactionsApi.delete(id, scope, type);
        assert.equal(calls.at(-1).url, `/spaces/${id}/${type}s/${id}`);
      }
      const first = plansQueryOptions.findAll({ page: 2 }, scope);
      assert.deepEqual(first.queryKey.slice(0, 3), ['plans', other, id]);
      const otherSpace = plansQueryOptions.findAll({ page: 2 }, { ...scope, spaceId: other });
      assert.notDeepEqual(first.queryKey, otherSpace.queryKey);
      assert.notDeepEqual(first.queryKey, plansQueryOptions.findAll({ page: 2 }, { ...scope, userId: id }).queryKey);
      await assert.rejects(plansApi.archive(id, undefined));
      assert.ok(calls.every(({ url }) => url.startsWith(`/spaces/${id}/`)));
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  } finally {
    await server.close();
  }
});
