import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('a missing category preserves the group expense and can be resolved by refreshing', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const { expensesApi } = await server.ssrLoadModule('/src/entities/expenses/api/expenses.api.ts');
    const originalGet = apiClient.get;
    const groupId = 'a'.repeat(24);
    const categoryId = 'b'.repeat(24);
    const expense = {
      _id: 'c'.repeat(24),
      type: 'expense',
      accountId: 'd'.repeat(24),
      snapshotId: 'e'.repeat(24),
      category: categoryId,
      amount: 0.001,
      currency: 'KWD',
      transactionDate: '2026-10-18',
      items: [],
    };
    let unavailable = true;
    apiClient.get = async (url) => {
      assert.ok(url.startsWith(`/groups/${groupId}/`));
      if (url.endsWith(`/expense-categories/${categoryId}`)) {
        if (unavailable) throw new Error('Category unavailable');
        return {
          data: {
            _id: categoryId,
            name: 'Покупки',
            isArchived: false,
            createdAt: '2026-10-18',
            updatedAt: '2026-10-18',
          },
        };
      }
      return {
        data: {
          items: [expense], total: 1, page: 1, limit: 20,
        },
      };
    };
    try {
      const scope = { kind: 'group', userId: 'f'.repeat(24), groupId };
      const first = (await expensesApi.findAll({}, scope)).items[0];
      assert.equal(first.amount, 0.001);
      assert.equal(first.categoryUnavailable, true);
      assert.equal(first.category._id, categoryId);
      unavailable = false;
      const refreshed = (await expensesApi.findAll({}, scope)).items[0];
      assert.equal(refreshed.categoryUnavailable, false);
      assert.equal(refreshed.category.name, 'Покупки');
    } finally {
      apiClient.get = originalGet;
    }
  } finally {
    await server.close();
  }
});
