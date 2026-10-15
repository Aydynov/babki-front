// FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test
// src/entities/incomes/api/income-history.test.mjs
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import test from 'node:test';
import { createServer } from 'vite';

test('currency history loads every page over HTTP and rejects incomplete history', async () => {
  const id = (n) => n.toString(16).padStart(24, '0');
  const rows = Array.from({ length: 12 }, (_, index) => ({
    _id: id(index + 100),
    accountId: id(1),
    snapshotId: id(2),
    type: 'income',
    currency: 'USD',
    amount: index + 1,
    source: `Income ${index}`,
    transactionDate: `2026-10-${String(index + 1).padStart(2, '0')}`,
  }));
  const calls = [];
  let fail = false;
  const http = createHttpServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    calls.push(Object.fromEntries(url.searchParams));
    const page = Number(url.searchParams.get('page'));
    res.setHeader('Content-Type', 'application/json');
    if (fail && page === 2) {
      res.writeHead(500);
      res.end('{}');
      return;
    }
    res.end(JSON.stringify({
      items: rows.slice((page - 1) * 4, page * 4), total: 12, page, limit: 4,
    }));
  });
  await new Promise((resolve) => {
    http.listen(0, '127.0.0.1', resolve);
  });
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/client.ts');
    apiClient.defaults.baseURL = `http://127.0.0.1:${http.address().port}`;
    const { incomesQueryOptions, incomesQueryKeys } = await server.ssrLoadModule(
      '/src/entities/incomes/api/incomes.query.ts',
    );
    assert.equal(typeof incomesQueryOptions.currencyHistory, 'function');
    const query = { fromDate: '2026-10-01', toDate: '2026-10-31', currency: 'USD' };
    const options = incomesQueryOptions.currencyHistory(query);
    const result = await options.queryFn({});
    assert.deepEqual(result.map((row) => row._id), [...rows].reverse().map((row) => row._id));
    assert.deepEqual(result.slice(0, 5).map((row) => row.amount), [12, 11, 10, 9, 8]);
    assert.ok(calls.every((call) => (
      call.currency === 'USD' && call.fromDate === query.fromDate && call.toDate === query.toDate
    )));
    assert.deepEqual(calls.map((call) => call.page), ['1', '2', '3']);
    assert.deepEqual(options.queryKey.slice(0, 2), incomesQueryKeys.listAll());
    assert.notDeepEqual(options.queryKey, incomesQueryOptions.currencyHistory({ ...query, currency: 'RUB' }).queryKey);
    assert.notDeepEqual(options.queryKey, incomesQueryOptions.currencyHistory({
      ...query, fromDate: '2026-09-01',
    }).queryKey);
    fail = true;
    await assert.rejects(options.queryFn({}));
  } finally {
    await server.close();
    await new Promise((resolve) => {
      http.close(resolve);
    });
  }
});
