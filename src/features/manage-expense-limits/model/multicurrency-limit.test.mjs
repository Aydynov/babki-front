import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const load = async (path) => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
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
