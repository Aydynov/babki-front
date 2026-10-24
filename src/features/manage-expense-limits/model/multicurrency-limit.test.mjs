import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const load = async (path) => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': new URL('../../../', import.meta.url).pathname } },
    cacheDir: 'node_modules/.vite-limit-form-test',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
  try {
    return await server.ssrLoadModule(path);
  } finally {
    await server.close();
  }
};

const draft = (key, currency) => ({
  key,
  baselineTotal: null,
  values: { categoryId: '507f1f77bcf86cd799439011', currency, total: '100' },
});

test('allows the same category in different currencies but rejects duplicate currency scope', async () => {
  const model = await load('/src/features/manage-expense-limits/model/validation.ts');

  assert.equal(model.expenseLimitFormSchema.safeParse({
    drafts: [draft('rub', 'RUB'), draft('usd', 'USD')],
  }).success, true);
  assert.equal(model.expenseLimitFormSchema.safeParse({
    drafts: [draft('rub-1', 'RUB'), draft('rub-2', 'RUB')],
  }).success, false);
});

test('validates totals using each draft currency precision', async () => {
  const model = await load('/src/features/manage-expense-limits/model/validation.ts');

  assert.equal(model.expenseLimitDraftValuesSchema.safeParse(
    draft('jpy', 'JPY').values,
  ).success, true);
  assert.equal(model.expenseLimitDraftValuesSchema.safeParse({
    ...draft('jpy', 'JPY').values,
    total: '100.5',
  }).success, false);
});

test('new drafts inherit currency, dates span the calendar month, and formatting alone is not dirty', async () => {
  const model = await load('/src/features/manage-expense-limits/model/limit-draft.ts');
  assert.equal(model.createEmptyExpenseLimitDraft('USD').values.currency, 'USD');
  assert.deepEqual(model.getExpenseLimitMonthRange('2024-02-10'), { startDate: '2024-02-01', endDate: '2024-02-29' });
  assert.equal(model.isExpenseLimitDraftDirty({
    ...draft('existing', 'USD'),
    baselineTotal: 100,
    values: { ...draft('existing', 'USD').values, total: '100.00' },
  }), false);
  const { expenseLimitDraftValuesSchema: schema } = await load(
    '/src/features/manage-expense-limits/model/validation.ts',
  );
  assert.equal(schema.safeParse({ ...draft('new', 'USD').values, total: '0' }).success, false);
  assert.equal(schema.safeParse({ ...draft('new', 'USD').values, total: '0.01' }).success, true);
});
