import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const load = async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    return await server.ssrLoadModule('/src/entities/reports/model/schemas.ts');
  } finally {
    await server.close();
  }
};

const bucket = (currency, expenses = 0) => ({
  currency,
  incomes: 0,
  expenses,
  transfersIn: 0,
  transfersOut: 0,
  balance: 0,
  saving: 0,
  expensesByCategory: [],
});

test('accepts zero-activity currency buckets and rejects scalar legacy reports', async () => {
  const model = await load();
  const report = { period: '2026-09-01', currencies: [bucket('RUB', 100), bucket('USD')] };

  assert.deepEqual(model.reportPeriodSchema.parse(report), report);
  assert.equal(model.reportPeriodSchema.safeParse({
    period: '2026-09-01', expenses: 100, incomes: 0, saving: 0, balance: 0,
  }).success, false);
});

test('orders report buckets default-first and preserves independent transfer totals', async () => {
  const model = await load();
  const currencies = [bucket('EUR'), bucket('RUB'), bucket('USD')];
  currencies[0].transfersIn = 10;
  currencies[0].transfersOut = 7;

  assert.deepEqual(
    model.sortReportCurrencies?.(currencies, 'USD').map(({ currency }) => currency),
    ['USD', 'EUR', 'RUB'],
  );
  assert.deepEqual(model.sortReportCurrencies?.(currencies, 'USD')[1], currencies[0]);
});

test('builds one zero-filled monthly series per currency', async () => {
  const model = await load();
  const viewModel = await (async () => {
    const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
    try {
      return await server.ssrLoadModule('/src/entities/reports/model/report-view-model.ts');
    } finally {
      await server.close();
    }
  })();
  const reports = [
    { period: '2026-01-01', currencies: [bucket('USD', 10)] },
    { period: '2026-02-01', currencies: [bucket('RUB', 20)] },
  ].map((report) => model.reportPeriodSchema.parse(report));

  const series = viewModel.getMonthlyCurrencySeries(reports, 'RUB');
  assert.deepEqual(series.map(({ currency }) => currency), ['RUB', 'USD']);
  assert.equal(series[0].periods[0].expenses, 0);
  assert.equal(series[1].periods[1].expenses, 0);
  assert.deepEqual(
    viewModel.getMonthlyCurrencySeries([], 'USD'),
    [{ currency: 'USD', periods: [] }],
  );
});
