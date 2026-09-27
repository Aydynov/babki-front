import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./monthly-expense-category-buckets.ts').catch(() => ({}));

const bucket = (currency, expenses, totals) => ({
  currency,
  expenses,
  expensesByCategory: totals,
});

test('uses only expense currencies from the selected month in a year report', async () => {
  const model = await modelPromise;
  const reports = [
    {
      period: '2026-07',
      currencies: [bucket('EUR', 30, [{ categoryId: 'food', total: 30 }])],
    },
    {
      period: '2026-08',
      currencies: [
        bucket('USD', 120, [{ categoryId: 'fun', total: 120 }]),
        bucket('EUR', 30, [{ categoryId: 'food', total: 30 }]),
        bucket('RUB', 0, [{ categoryId: 'food', total: 0 }]),
      ],
    },
  ];

  assert.equal(typeof model.getMonthlyExpenseCategoryBuckets, 'function');
  assert.deepEqual(model.getMonthlyExpenseCategoryBuckets(reports, '2026-08'), [
    reports[1].currencies[1],
    reports[1].currencies[0],
  ]);
  assert.deepEqual(model.getMonthlyExpenseCategoryBuckets(reports, '2026-09'), []);
});
