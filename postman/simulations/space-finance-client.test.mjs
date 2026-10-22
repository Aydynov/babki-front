import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

// Run with the local space-finance simulation on port 4917. Every API call below uses real HTTP.
const base = 'http://127.0.0.1:4917/api/api/v1';
const control = async (path, body) => {
  const response = await fetch(`${base}/__test/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(response.ok, true);
  return response.json();
};

test('space finance clients send supported contracts over HTTP and preserve lifecycle responses', async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const { env } = await server.ssrLoadModule('/src/shared/lib/env.ts');
    env.USE_LOCAL_AUTH_TOKEN = true;
    env.LOCAL_AUTH_TOKEN = 'synthetic-space-fixture';
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/client.ts');
    apiClient.defaults.baseURL = base;
    const load = async (name) => await server.ssrLoadModule(`/src/entities/${name}/api/${name}.api.ts`);
    const { spacesApi } = await load('spaces');
    const { accountsApi } = await load('accounts');
    const { incomesApi } = await load('incomes');
    const { expensesApi } = await load('expenses');
    const { transfersApi } = await load('transfers');
    const { transactionsApi } = await load('transactions');
    const { expenseCategoriesApi } = await load('expense-categories');
    const { plansApi } = await load('plans');
    const { debtsApi } = await load('debts');
    const { debtTransactionsApi } = await load('debt-transactions');
    const { reportsApi } = await load('reports');
    await control('reset', {});
    assert.equal((await spacesApi.list()).total, 0);
    const space = await spacesApi.create({ name: 'Личный учёт' });
    const second = await spacesApi.create({ name: 'Общие расходы' });
    assert.equal((await spacesApi.list()).total, 2);
    const scope = { userId: '000000000000000000000001', spaceId: space.id };
    const other = { ...scope, spaceId: second.id };
    const account = await accountsApi.create(
      {
        name: 'Рубли',
        currency: 'RUB',
        type: 'balance',
        amount: 1000,
      },
      scope,
    );
    const saving = await accountsApi.create(
      {
        name: 'Накопления',
        currency: 'RUB',
        type: 'saving',
        amount: 0,
      },
      scope,
    );
    const usd = await accountsApi.create(
      {
        name: 'Доллары',
        currency: 'USD',
        type: 'balance',
        amount: 100,
      },
      scope,
    );
    assert.deepEqual(await accountsApi.findAll({}, other), []);
    const category = await expenseCategoriesApi.create({ name: 'Продукты' }, scope);
    const date = '2026-10-22T09:00:00.000Z';
    const income = await incomesApi.create(
      {
        accountId: saving._id,
        amount: 10,
        transactionDate: date,
        description: 'Доход',
      },
      scope,
    );
    const expense = await expensesApi.create(
      {
        accountId: account._id,
        categoryId: category._id,
        amount: 5,
        transactionDate: date,
        participantId: scope.userId,
        description: 'Продукты',
      },
      scope,
    );
    await expensesApi.create(
      {
        accountId: usd._id,
        categoryId: category._id,
        amount: 1,
        transactionDate: date,
        description: 'Вторая валюта',
      },
      scope,
    );
    assert.equal(expense.participantActor.userId, scope.userId);
    assert.equal((await expensesApi.findTotalRevenue({}, scope)).totalRevenue, null);
    const transfer = await transfersApi.create(
      {
        sourceAccountId: account._id,
        destinationAccountId: saving._id,
        sourceAmount: 25,
        destinationAmount: 25,
        transactionDate: date,
      },
      scope,
    );
    assert.equal(transfer.source.currency, transfer.destination.currency);
    assert.equal((await transactionsApi.findOne(income._id, scope, 'income'))._id, income._id);
    assert.equal((await transactionsApi.findOne(expense._id, scope, 'expense')).type, 'expense');
    assert.equal((await transactionsApi.findOne(transfer._id, scope, 'transfer')).type, 'transfer');
    const plan = await plansApi.create(
      {
        description: 'Покупка',
        targetDate: date,
        amount: 10,
        currency: 'RUB',
        categoryId: category._id,
      },
      scope,
    );
    const closed = await plansApi.close(
      plan._id,
      { accountId: account._id, amount: 12, participantId: scope.userId },
      scope,
    );
    assert.equal(closed.amount, 10);
    assert.ok(closed.expenseId);
    await assert.rejects(
      plansApi.close(plan._id, { accountId: account._id }, scope),
      (e) => e.response.status === 400,
    );
    const debt = await debtsApi.create({ debtor: 'Друг', principalAmount: 100, currency: 'RUB' }, scope);
    const cash = await debtsApi.repay(
      debt._id,
      {
        amount: 20,
        repaymentDate: date,
        isIncome: true,
        accountId: account._id,
      },
      scope,
    );
    assert.equal(cash.debt.remainingAmount, 80);
    assert.ok(cash.repayment.incomeId);
    await assert.rejects(
      transactionsApi.delete(cash.repayment.incomeId, scope, 'income'),
      (e) => e.response.status === 409,
    );
    const cancelled = await debtsApi.cancelRepayment(debt._id, cash.repayment._id, scope);
    assert.equal(cancelled.debt.remainingAmount, 100);
    assert.equal(cancelled.repayment.cancelledByActor.userId, scope.userId);
    await assert.rejects(
      debtsApi.cancelRepayment(debt._id, cash.repayment._id, scope),
      (e) => e.response.status === 409,
    );
    const noncash = await debtsApi.repay(
      debt._id,
      { amount: 5, repaymentDate: date, isIncome: false },
      scope,
    );
    assert.equal(noncash.debt.remainingAmount, 95);
    const history = await debtTransactionsApi.findAll(debt._id, {}, undefined, scope);
    assert.equal(history.total, 2);
    await plansApi.archive(plan._id, scope);
    await debtsApi.archive(debt._id, scope);
    await accountsApi.archive(usd._id, scope);
    assert.equal(
      (await plansApi.findAll({ includeArchived: true }, undefined, scope)).items[0].status,
      'closed',
    );
    assert.equal(
      (await debtsApi.findAll({ includeArchived: true }, undefined, scope)).items[0].remainingAmount,
      95,
    );
    assert.ok((await accountsApi.findOne(usd._id, scope)).archivedAt);
    assert.equal(
      (
        await reportsApi.getMonthly(
          { fromDate: '2026-10-01', toDate: '2026-10-31', categories: [category._id] },
          scope,
        )
      )[0].period,
      '2026-10',
    );
    assert.equal(
      (await incomesApi.findTotalRevenue({ fromDate: '2026-10-01', toDate: '2026-10-31' }, scope))
        .currencies.length,
      2,
    );
    await control('config', { failure: { match: `/accounts/${account._id}`, status: 403 } });
    await assert.rejects(
      accountsApi.rename(account._id, { name: 'Недоступно' }, scope),
      (e) => e.response.status === 403,
    );
    await control('config', { failure: { match: '/incomes', status: 503 } });
    await assert.rejects(
      incomesApi.create({ accountId: account._id, amount: 1, transactionDate: date }, scope),
      (e) => e.response.status === 503,
    );
    await control('config', { failure: null, spaceDenied: true });
    await assert.rejects(spacesApi.get(space.id), (e) => e.response.status === 404);
    await control('config', { spaceDenied: false });
    const state = await control('state');
    const spec = JSON.parse(
      await readFile(
        new URL('../../../babki-back/postman/specs/babki.openapi.json', import.meta.url),
        'utf8',
      ),
    );
    state.requests.forEach((request) => {
      const match = Object.entries(spec.paths).find(([path]) => (
        new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(request.path)
      ));
      assert.ok(match, `Unknown contract path: ${request.path}`);
      const operation = match[1][request.method.toLowerCase()];
      assert.ok(operation, `Unknown contract method: ${request.method} ${request.path}`);
      const allowedQuery = [...(match[1].parameters || []), ...(operation.parameters || [])]
        .filter((parameter) => parameter.in === 'query')
        .map((parameter) => parameter.name);
      Object.keys(request.query).forEach((key) => assert.ok(allowedQuery.includes(key), `Invalid query field ${key}`));
      const schema = operation.requestBody?.content?.['application/json']?.schema;
      if (schema?.additionalProperties === false) {
        Object.keys(request.body).forEach((key) => {
          assert.ok(Object.hasOwn(schema.properties, key), `Removed body field ${key}`);
        });
        (schema.required || []).forEach((key) => {
          assert.ok(Object.hasOwn(request.body, key), `Missing body field ${key}`);
        });
      }
    });
    assert.ok(state.requests.length > 0, 'real HTTP must exercise the changed client workflows');
    assert.ok(
      state.requests.every(
        (r) => !r.path.includes('/groups')
          && !r.path.includes('/snapshots')
          && !r.path.includes('/incomes/revenue'),
      ),
    );
    // eslint-disable-next-line no-console -- Report the observed real HTTP count in the test evidence.
    console.log(
      `Verified ${state.requests.length} frontend HTTP calls against backend OpenAPI paths/body fields.`,
    );
  } finally {
    await server.close();
  }
});
