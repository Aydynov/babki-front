import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./sort-monthly-expense-category-rows.ts').catch(() => ({}));

const categories = [
  { _id: 'food', name: 'Food' },
  { _id: 'travel', name: 'Travel' },
  { _id: 'home', name: 'Home' },
  { _id: 'other', name: 'Other' },
  { _id: 'health', name: 'Health' },
];

const categoryIds = (rows) => rows.map(({ category }) => category._id);

test('orders categories by selected-month totals and keeps missing categories at the end', async () => {
  const model = await modelPromise;
  assert.equal(typeof model.getSortedMonthlyExpenseCategoryRows, 'function');

  const bucket = {
    expensesByCategory: [
      { categoryId: 'food', total: 150 },
      { categoryId: 'travel', total: 400 },
      { categoryId: 'other', total: 50 },
    ],
  };
  const rows = model.getSortedMonthlyExpenseCategoryRows(categories, bucket);

  assert.deepEqual(categoryIds(rows), ['travel', 'food', 'other', 'home', 'health']);
  assert.deepEqual(rows.map(({ total }) => total), [400, 150, 50, 0, 0]);
  assert.deepEqual(categories.map(({ _id }) => _id), [
    'food', 'travel', 'home', 'other', 'health',
  ]);
});

test('preserves configured order for equal totals and recalculates for a different bucket', async () => {
  const model = await modelPromise;
  assert.equal(typeof model.getSortedMonthlyExpenseCategoryRows, 'function');

  const firstRows = model.getSortedMonthlyExpenseCategoryRows(categories, {
    expensesByCategory: [
      { categoryId: 'food', total: 50 },
      { categoryId: 'travel', total: 50 },
      { categoryId: 'home', total: 0 },
    ],
  });
  const secondRows = model.getSortedMonthlyExpenseCategoryRows(categories, {
    expensesByCategory: [
      { categoryId: 'home', total: 100 },
      { categoryId: 'food', total: 20 },
      { categoryId: 'travel', total: 20 },
    ],
  });

  assert.deepEqual(categoryIds(firstRows), ['food', 'travel', 'home', 'other', 'health']);
  assert.deepEqual(categoryIds(secondRows), ['home', 'food', 'travel', 'other', 'health']);
  assert.deepEqual(secondRows.map(({ total }) => total), [100, 20, 20, 0, 0]);
});

test('separates archived categories without changing currency totals or tie order', async () => {
  const { getSortedMonthlyExpenseCategoryRows } = await modelPromise;
  const mixed = [
    { _id: 'active', isArchived: false },
    { _id: 'archived', isArchived: true },
    { _id: 'zero', isArchived: false },
    { _id: 'tie', isArchived: false },
  ];
  const bucket = {
    expenses: 100,
    expensesByCategory: [
      { categoryId: 'active', total: 30 },
      { categoryId: 'tie', total: 30 },
      { categoryId: 'archived', total: 40 },
    ],
  };
  assert.deepEqual(
    categoryIds(getSortedMonthlyExpenseCategoryRows(mixed, bucket, 'active')),
    ['active', 'tie', 'zero'],
  );
  assert.deepEqual(categoryIds(getSortedMonthlyExpenseCategoryRows(mixed, bucket, 'archived')), ['archived']);
  assert.equal(bucket.expenses, 100);
  assert.equal(getSortedMonthlyExpenseCategoryRows(mixed, bucket, 'archived')[0].total, 40);
});
