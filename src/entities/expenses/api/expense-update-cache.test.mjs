import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

test('expense success cancels stale reads, isolates caches and tolerates failed dependent refresh', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  try {
    const { BudgetProvider } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
    const { useUpdateExpenseMutation, expensesQueryKeys } = await server.ssrLoadModule(
      '/src/entities/expenses/api/expenses.query.ts',
    );
    const { scopedKey } = await server.ssrLoadModule('/src/shared/lib/budget-api/index.ts');
    const scope = { userId: 'user-1', spaceId: '507f1f77bcf86cd799439013' };
    const otherScope = { ...scope, spaceId: '507f1f77bcf86cd799439014' };
    client.setQueryData(['users', 'me'], { _id: scope.userId });
    let refreshes = 0;
    client.invalidateQueries = async () => {
      refreshes += 1;
      throw new Error('Dependent refresh failed');
    };
    const oldExpense = { _id: 'expense-1', amount: 10 };
    const updated = { ...oldExpense, amount: 20 };
    const listKey = scopedKey(scope, expensesQueryKeys.list({ page: 1 }));
    const otherKey = scopedKey(otherScope, expensesQueryKeys.list({ page: 1 }));
    const detailKey = scopedKey(scope, expensesQueryKeys.detail(oldExpense._id));
    const response = { items: [oldExpense], total: 1 };
    client.setQueryData(listKey, response);
    client.setQueryData(otherKey, response);
    client.setQueryData(detailKey, oldExpense);
    let aborted = false;
    const staleRead = client.fetchQuery({
      queryKey: listKey,
      queryFn: ({ signal }) => new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true;
          resolve(response);
        });
      }),
    }).catch(() => undefined);
    let mutation;
    function Probe() {
      mutation = useUpdateExpenseMutation();
      return null;
    }
    renderToString(createElement(
      QueryClientProvider,
      { client },
      createElement(BudgetProvider, { value: { scope } }, createElement(Probe)),
    ));
    const { expensesApi } = await server.ssrLoadModule('/src/entities/expenses/api/expenses.api.ts');
    const originalUpdate = expensesApi.update;
    expensesApi.update = async () => updated;
    try {
      await mutation.mutateAsync({ expenseId: oldExpense._id, payload: { amount: 20 } });
    } finally {
      expensesApi.update = originalUpdate;
    }
    assert.equal(refreshes, 1);
    assert.equal(aborted, true);
    await staleRead;
    assert.deepEqual(client.getQueryData(detailKey), updated);
    assert.deepEqual(client.getQueryData(listKey), { ...response, items: [updated] });
    assert.deepEqual(client.getQueryData(otherKey), response);
  } finally {
    client.clear();
    await server.close();
  }
});
