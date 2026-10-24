import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('currency filtering preserves API order and totals never combine currencies; progress stays finite', async () => {
  const server = await createServer({
    configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, ws: false },
  });
  try {
    const model = await server.ssrLoadModule('/src/entities/expense-limits/model/presentation.ts');
    const limits = [
      {
        _id: 'rub', currency: 'RUB', total: 100, rest: 60,
      },
      {
        _id: 'usd', currency: 'USD', total: 20, rest: -5,
      },
      {
        _id: 'rub-2', currency: 'RUB', total: 50, rest: 0,
      },
    ];
    assert.deepEqual(model.getExpenseLimitsForCurrency(limits, 'RUB').map((l) => l._id), ['rub', 'rub-2']);
    assert.equal(model.getExpenseLimitTotal(limits, 'RUB'), 150);
    assert.equal(model.getExpenseLimitTotal(limits, 'EUR'), 0);
    assert.deepEqual(model.getExpenseLimitsForCurrency(limits, undefined), []);
    assert.equal(model.getExpenseLimitProgress(limits[0]), 40);
    assert.equal(model.getExpenseLimitProgress(limits[1]), 100);
    assert.equal(model.getExpenseLimitProgress({ total: 0, rest: 0 }), 0);
  } finally {
    await server.close();
  }
});
