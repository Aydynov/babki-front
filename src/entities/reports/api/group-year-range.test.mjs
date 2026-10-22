import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Run explicitly: node --test src/entities/reports/api/group-year-range.test.mjs
// GET is replaced locally; this regression check never sends HTTP requests.
test('space annual reports use actual account years, current UTC year and bounded backend ranges', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { reportsApi } = await server.ssrLoadModule('/src/entities/reports/api/reports.api.ts');
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
    const originalGet = apiClient.get;
    const scope = { userId: 'b'.repeat(24), spaceId: 'a'.repeat(24) };
    const currentYear = new Date().getUTCFullYear();
    const calls = [];
    let openedAt = [`${currentYear - 2}-07-01T00:00:00Z`, `${currentYear}-02-01T00:00:00Z`];
    apiClient.get = async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/accounts')) return { data: openedAt.map((date) => ({ openedAt: date })) };
      const first = Number(options.params.fromDate.slice(0, 4));
      const last = Number(options.params.toDate.slice(0, 4));
      assert.ok(last - first <= 100);
      return {
        data: Array.from({ length: last - first + 1 }, (_, index) => ({
          period: String(first + index), currencies: [],
        })),
      };
    };
    try {
      const controller = new AbortController();
      const reports = await reportsApi.getYearly(undefined, scope, controller.signal);
      assert.deepEqual(reports.map(({ period }) => Number(period)), [currentYear - 2, currentYear - 1, currentYear]);
      assert.equal(calls[1].options.params.fromDate, `${currentYear - 2}-01-01T00:00:00.000Z`);
      assert.equal(calls[1].options.params.toDate, `${currentYear}-12-31T23:59:59.999Z`);
      assert.ok(calls.every(({ options }) => options.signal === controller.signal));
      assert.ok(calls.every(({ url }) => url.startsWith(`/spaces/${scope.spaceId}/`)));
      calls.length = 0;
      openedAt = [];
      assert.deepEqual(await reportsApi.getYearly(undefined, scope), []);
      assert.equal(calls.length, 1);
      calls.length = 0;
      openedAt = [`${currentYear - 102}-01-01T00:00:00Z`];
      const longHistory = await reportsApi.getYearly(undefined, scope);
      assert.equal(longHistory.length, 103);
      assert.equal(new Set(longHistory.map(({ period }) => period)).size, 103);
      assert.equal(calls.length, 3);
      calls.length = 0;
      const categories = ['c'.repeat(24)];
      await reportsApi.getYearly({ categories, fromDate: '1997-01-01', toDate: '1998-12-31' }, scope);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].options.params.categories, categories.join(','));
      assert.equal(calls[0].options.params.fromDate, '1997-01-01T00:00:00.000Z');
      assert.equal(calls[0].options.params.toDate, '1998-12-31T23:59:59.999Z');
    } finally {
      apiClient.get = originalGet;
    }
  } finally {
    await server.close();
  }
});
