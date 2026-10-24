import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

test('limit writes reconcile only matching period/currency/category caches despite failed refresh', async () => {
  const server = await createServer({
    configFile: false,
    define: { 'import.meta.env.FRONT_BASE_API_URL': JSON.stringify('http://127.0.0.1:4931/api/api/v1') },
    resolve: { alias: { '@': new URL('../../../', import.meta.url).pathname } },
    cacheDir: 'node_modules/.vite-limit-cache-test',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  try {
    const { BudgetProvider } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
    const q = await server.ssrLoadModule('/src/entities/expense-limits/api/expense-limits.query.ts');
    const { expenseLimitsApi: api } = await server.ssrLoadModule(
      '/src/entities/expense-limits/api/expense-limits.api.ts',
    );
    const scope = { userId: 'user-1', spaceId: '507f1f77bcf86cd799439013' };
    const category = {
      _id: '507f1f77bcf86cd799439011',
      spaceId: scope.spaceId,
      name: 'Food',
      isArchived: false,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };
    const row = {
      _id: '507f1f77bcf86cd799439015',
      spaceId: scope.spaceId,
      category,
      currency: 'USD',
      total: 100,
      rest: 40,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    };
    const saved = { ...row, total: 120, rest: 60 };
    const key = (params, s = scope) => q.expenseLimitsQueryOptions.findAll(params, s).queryKey;
    const currentKey = key({ periodDate: '2026-10-31' });
    const usdKey = key({ periodDate: '2026-10-31', currency: 'USD', categoryId: category._id });
    const excluded = [key({ periodDate: '2026-10-31', currency: 'RUB' }), key({ periodDate: '2026-11-01' }),
      key({ periodDate: '2026-10-31', categoryId: '507f1f77bcf86cd799439099' })];
    const otherKey = key({ periodDate: '2026-10-31' }, { ...scope, spaceId: '507f1f77bcf86cd799439014' });
    [currentKey, usdKey, otherKey].forEach((k) => client.setQueryData(k, [row]));
    excluded.forEach((k) => client.setQueryData(k, []));
    client.setQueryData(['users', 'me'], { _id: scope.userId });
    client.invalidateQueries = async () => {
      throw new Error('refresh failure');
    };
    let aborted = false;
    const read = client.fetchQuery({
      queryKey: currentKey,
      queryFn: ({ signal }) => new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true;
          resolve([row]);
        });
      }),
    }).catch(() => undefined);
    let mutations;
    function Probe() {
      mutations = {
        create: q.useCreateExpenseLimitMutation(),
        update: q.useUpdateExpenseLimitMutation(),
        remove: q.useDeleteExpenseLimitMutation(),
      };
      return null;
    }
    renderToString(createElement(
      QueryClientProvider,
      { client },
      createElement(BudgetProvider, { value: { scope } }, createElement(Probe)),
    ));
    const original = { create: api.create, update: api.update, delete: api.delete };
    api.update = async () => saved;
    api.create = async () => ({ ...row, _id: '507f1f77bcf86cd799439016' });
    api.delete = async () => undefined;
    try {
      await mutations.update.mutateAsync({ limitId: row._id, payload: { total: 120 } });
      assert.equal(aborted, true);
      await read;
      [currentKey, usdKey].forEach((k) => assert.deepEqual(client.getQueryData(k), [saved]));
      excluded.forEach((k) => assert.deepEqual(client.getQueryData(k), []));
      assert.deepEqual(client.getQueryData(otherKey), [row]);
      await mutations.create.mutateAsync({ payload: { categoryId: category._id, currency: 'USD', total: 100 } });
      assert.equal(client.getQueryData(currentKey).length, 2);
      await mutations.remove.mutateAsync(row._id);
      assert.equal(client.getQueryData(currentKey).length, 1);
      assert.equal(client.getQueryData(q.expenseLimitsQueryOptions.findOne(row._id, scope).queryKey), undefined);
      client.setQueryData(['users', 'me'], { _id: 'other-user' });
      await mutations.update.mutateAsync({ limitId: row._id, payload: { total: 120 } });
      assert.equal(client.getQueryData(currentKey).length, 1);
    } finally {
      Object.assign(api, original);
    }
  } finally {
    client.clear();
    await server.close();
  }
});
