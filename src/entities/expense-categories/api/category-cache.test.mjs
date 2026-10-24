import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

test('category mutations preserve saved data after failed refresh and isolate scopes', async () => {
  const server = await createServer({
    configFile: false,
    envPrefix: 'FRONT_',
    define: { 'import.meta.env.FRONT_BASE_API_URL': JSON.stringify('http://127.0.0.1:4917/api/api/v1') },
    cacheDir: 'node_modules/.vite-category-cache-test',
    resolve: { alias: { '@': new URL('../../../', import.meta.url).pathname } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  try {
    const { BudgetProvider } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
    const queries = await server.ssrLoadModule('/src/entities/expense-categories/api/expense-categories.query.ts');
    const { expenseCategoriesApi: api } = await server.ssrLoadModule(
      '/src/entities/expense-categories/api/expense-categories.api.ts',
    );
    const scope = { userId: 'user-1', spaceId: '507f1f77bcf86cd799439013' };
    const otherScope = { ...scope, spaceId: '507f1f77bcf86cd799439014' };
    client.setQueryData(['users', 'me'], { _id: scope.userId });
    const old = {
      _id: '507f1f77bcf86cd799439015',
      spaceId: scope.spaceId,
      name: 'Old',
      color: '#C94F4F',
      description: '',
      isArchived: false,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const saved = { ...old, name: 'Saved', isArchived: true };
    const created = { ...old, _id: '507f1f77bcf86cd799439016', name: 'Created' };
    const key = queries.expenseCategoriesQueryOptions.findAll(scope).queryKey;
    const otherKey = queries.expenseCategoriesQueryOptions.findAll(otherScope).queryKey;
    const detailKey = queries.expenseCategoriesQueryOptions.findOne(old._id, scope).queryKey;
    client.setQueryData(key, [old]);
    client.setQueryData(otherKey, [old]);
    client.setQueryData(detailKey, old);
    client.invalidateQueries = async () => {
      throw new Error('Dependent refresh failed');
    };
    let aborted = false;
    const staleRead = client.fetchQuery({
      queryKey: key,
      queryFn: ({ signal }) => new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true;
          resolve([old]);
        });
      }),
    }).catch(() => undefined);
    let mutations;
    function Probe() {
      mutations = {
        create: queries.useCreateExpenseCategoryMutation(),
        update: queries.useUpdateExpenseCategoryMutation(),
        remove: queries.useDeleteExpenseCategoryMutation(),
      };
      return null;
    }
    renderToString(createElement(
      QueryClientProvider,
      { client },
      createElement(BudgetProvider, { value: { scope } }, createElement(Probe)),
    ));
    const original = { create: api.create, update: api.update, remove: api.remove };
    api.create = async () => created;
    api.update = async () => saved;
    api.remove = async () => undefined;
    try {
      await mutations.update.mutateAsync({ categoryId: old._id, payload: { name: 'Saved', isArchived: true } });
      await staleRead;
      assert.equal(aborted, true);
      assert.deepEqual(client.getQueryData(key), [saved]);
      assert.deepEqual(client.getQueryData(detailKey), saved);
      await mutations.create.mutateAsync({ payload: { name: 'Created' } });
      assert.deepEqual(client.getQueryData(key), [saved, created]);
      await mutations.remove.mutateAsync({ categoryId: old._id });
      assert.deepEqual(client.getQueryData(key), [created]);
      assert.equal(client.getQueryData(detailKey), undefined);
      assert.deepEqual(client.getQueryData(otherKey), [old]);
      client.setQueryData(['users', 'me'], { _id: 'another-user' });
      await mutations.update.mutateAsync({ categoryId: old._id, payload: { name: 'Saved' } });
      await mutations.remove.mutateAsync({ categoryId: created._id });
      assert.deepEqual(client.getQueryData(key), [created]);
      assert.equal(client.getQueryData(detailKey), undefined);
    } finally {
      Object.assign(api, original);
    }
  } finally {
    client.clear();
    await server.close();
  }
});
