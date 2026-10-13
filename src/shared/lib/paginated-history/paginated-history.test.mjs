// Run: node --test src/shared/lib/paginated-history/paginated-history.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';

const load = () => import('./index.ts');
const item = (_id, transactionDate = '2026-10-10') => ({ _id, transactionDate });

test('loads every page using the actual server limit, deduplicates and globally sorts', async () => {
  const { loadPaginatedHistory } = await load();
  const calls = [];
  const rows = [item('a', '2026-10-01'), item('c'), item('b'), item('c'), item('d')];
  const result = await loadPaginatedHistory(async ({ page, limit }) => {
    calls.push([page, limit]);
    return {
      items: rows.slice((page - 1) * 2, page * 2), total: 5, page, limit: 2,
    };
  });
  assert.deepEqual(calls, [[1, 100], [2, 100], [3, 100]]);
  assert.deepEqual(result.map(({ _id }) => _id), ['d', 'c', 'b', 'a']);
});

test('handles empty history and propagates an intermediate page failure', async () => {
  const { loadPaginatedHistory } = await load();
  assert.deepEqual(await loadPaginatedHistory(async () => ({
    items: [], total: 0, page: 1, limit: 100,
  })), []);
  await assert.rejects(loadPaginatedHistory(async ({ page }) => {
    if (page === 2) throw new Error('offline');
    return {
      items: [item('a')], total: 2, page, limit: 1,
    };
  }), /offline/);
});

test('pagination clamps a removed last page and keeps complete ordered slices', async () => {
  const { paginateHistory } = await load();
  const rows = Array.from({ length: 23 }, (_, index) => item(String(index)));
  assert.deepEqual(paginateHistory(rows, 2).items, rows.slice(10, 20));
  assert.equal(paginateHistory(rows, 3).items.length, 3);
  assert.equal(paginateHistory(rows.slice(0, 20), 3).page, 2);
  assert.deepEqual(paginateHistory([], 4), {
    items: [], page: 1, pages: 1, total: 0,
  });
});
