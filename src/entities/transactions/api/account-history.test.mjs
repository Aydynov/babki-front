// Run with FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false:
// node --test src/entities/transactions/api/account-history.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('account history merges all income/expense pages and uses invalidatable query families', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/client.ts');
    const { transactionsQueryOptions, transactionsQueryKeys } = await server.ssrLoadModule(
      '/src/entities/transactions/api/transactions.query.ts',
    );
    const { transfersQueryOptions, transfersQueryKeys } = await server.ssrLoadModule(
      '/src/entities/transfers/api/transfers.query.ts',
    );
    const id = (n) => n.toString(16).padStart(24, '0');
    const query = { accountId: id(1), fromDate: '2026-10-01', toDate: '2026-10-31' };
    const calls = [];
    const income = Array.from({ length: 12 }, (_, i) => ({
      _id: id(i + 100),
      accountId: id(1),
      snapshotId: id(2),
      currency: 'RUB',
      amount: i,
      type: 'income',
      transactionDate: `2026-10-${String(i + 1).padStart(2, '0')}`,
    }));
    const expense = [{
      ...income[0], _id: id(500), type: 'expense', transactionDate: '2026-10-12',
    }];
    apiClient.defaults.adapter = async (config) => {
      calls.push(config.params);
      const rows = config.params.transactionType === 'income' ? income : expense;
      const { page } = config.params;
      return {
        data: {
          items: rows.slice((page - 1) * 5, page * 5), total: rows.length, page, limit: 5,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    const options = transactionsQueryOptions.accountHistory(query);
    const rows = await options.queryFn({});
    assert.equal(rows.length, 13);
    assert.equal(rows[0]._id, id(500));
    assert.equal(rows[1]._id, id(111));
    assert.equal(calls.length, 4);
    assert.ok(calls.every((call) => call.accountId === query.accountId && call.fromDate === query.fromDate));
    assert.deepEqual(options.queryKey.slice(0, 1), transactionsQueryKeys.all);
    assert.deepEqual(transfersQueryOptions.accountHistory(query).queryKey.slice(0, 1), transfersQueryKeys.all);
    apiClient.defaults.adapter = async () => {
      throw new Error('offline');
    };
    await assert.rejects(options.queryFn({}), /offline/);
  } finally {
    await server.close();
  }
});
