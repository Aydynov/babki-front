import assert from 'node:assert/strict';
import process from 'node:process';
import test, { before, after, beforeEach } from 'node:test';
import { createServer } from 'vite';

// Run against postman/simulations/category-resolution.sim.yaml; see category-resolution.md.
const baseURL = process.env.BABKI_CATEGORY_SIM_URL ?? 'http://127.0.0.1:4900/budget';
let server;
let expensesApi;
let expenseLimitsApi;
let queryClient;
let categoryOptions;
let resolveCategory;
const scope = (space = 'a', user = 'f') => ({ spaceId: space.repeat(24), userId: user.repeat(24) });
const paths = async () => (await fetch(`${baseURL}/requests`)).json();
const count = (requests, suffix) => requests.filter((path) => path.endsWith(suffix)).length;

before(async () => {
  server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
  apiClient.defaults.baseURL = baseURL;
  ({ expensesApi } = await server.ssrLoadModule('/src/entities/expenses/api/expenses.api.ts'));
  ({ expenseLimitsApi } = await server.ssrLoadModule('/src/entities/expense-limits/api/expense-limits.api.ts'));
  ({ queryClient } = await server.ssrLoadModule('/src/shared/lib/query-client.ts'));
  ({
    expenseCategoriesQueryOptions: categoryOptions,
    resolveExpenseCategory: resolveCategory,
  } = await server.ssrLoadModule('/src/entities/expense-categories/api/expense-categories.query.ts'));
});
beforeEach(async () => {
  queryClient.clear();
  await fetch(`${baseURL}/reset`);
});
after(async () => {
  queryClient?.clear();
  await server?.close();
});

test('20 expenses and two limits share one category list, including archived references', async () => {
  const [expenses, limits] = await Promise.all([
    expensesApi.findAll({}, scope()),
    expenseLimitsApi.findAll({ periodDate: '2026-10-01' }, scope()),
    queryClient.fetchQuery(categoryOptions.findAll(scope())),
  ]);
  assert.equal(expenses.items.length, 20);
  assert.equal(limits.length, 2);
  assert.equal(expenses.items[0].category.isArchived, true);
  assert.equal(limits[0].category.name, 'Покупки');
  const requests = await paths();
  assert.equal(count(requests, '/expense-categories'), 1);
  assert.equal(requests.filter((path) => path.includes('/expense-categories/')).length, 0);
  await expensesApi.findAll({}, scope());
  assert.equal(count(await paths(), '/expense-categories'), 1);
});

test('uses an already cached category list without category HTTP requests', async () => {
  await queryClient.fetchQuery(categoryOptions.findAll(scope()));
  await fetch(`${baseURL}/reset`);
  await expensesApi.findAll({}, scope());
  assert.equal((await paths()).filter((path) => path.includes('/expense-categories')).length, 0);
});

test('missing categories share one fallback request per ID across expenses and limits', async () => {
  const [expenses, limits] = await Promise.all([
    expensesApi.findAll({}, scope('d')),
    expenseLimitsApi.findAll({ periodDate: '2026-10-01' }, scope('d')),
  ]);
  assert.equal(expenses.items[0].category._id, 'e'.repeat(24));
  assert.equal(limits[0].category._id, 'e'.repeat(24));
  const requests = await paths();
  assert.equal(count(requests, '/expense-categories'), 1);
  assert.equal(count(requests, `/expense-categories/${'e'.repeat(24)}`), 1);
});

test('list failure falls back to a shared category detail request', async () => {
  const expenses = await expensesApi.findAll({}, scope('c'));
  assert.equal(expenses.items[0].categoryUnavailable, false);
  assert.equal(count(await paths(), `/expense-categories/${'b'.repeat(24)}`), 1);
});

test('category cache is isolated by both space and user and respects invalidation', async () => {
  await expensesApi.findAll({}, scope());
  await expensesApi.findAll({}, scope('b'));
  await expensesApi.findAll({}, scope('a', '1'));
  assert.equal(count(await paths(), '/expense-categories'), 3);
  await queryClient.invalidateQueries({ queryKey: categoryOptions.findAll(scope()).queryKey });
  await expensesApi.findAll({}, scope());
  assert.equal(count(await paths(), '/expense-categories'), 4);
});

test('unavailable categories preserve expenses but still reject unresolved limits', async () => {
  const expenses = await expensesApi.findAll({}, scope('9'));
  assert.equal(expenses.items.length, 20);
  assert.equal(expenses.items[0].amount, 10);
  assert.equal(expenses.items[0].categoryUnavailable, true);
  await assert.rejects(expenseLimitsApi.findAll({ periodDate: '2026-10-01' }, scope('9')));
});

test('cancelling one consumer does not cancel a shared category request', async () => {
  const controller = new AbortController();
  const cancelled = resolveCategory('b'.repeat(24), scope(), controller.signal);
  const other = resolveCategory('b'.repeat(24), scope());
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  assert.equal((await other).name, 'Покупки');
  assert.equal(count(await paths(), '/expense-categories'), 1);
});
