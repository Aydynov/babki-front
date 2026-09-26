import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAnnualCategoryCurrencies,
  getDailyExpenseCurrencies,
  getMonthlyMetricCurrencies,
} from './chart-currency-availability.ts';

test('daily chart offers only currencies found in expenses', () => {
  assert.deepEqual(
    getDailyExpenseCurrencies([{ currency: 'USD' }, { currency: 'RUB' }, { currency: 'USD' }]),
    ['RUB', 'USD'],
  );
  assert.deepEqual(getDailyExpenseCurrencies([]), []);
});

test('monthly chart offers currencies with any nonzero plotted metric', () => {
  const empty = {
    expenses: 0, incomes: 0, saving: 0, transfersIn: 0, transfersOut: 0,
  };
  assert.deepEqual(getMonthlyMetricCurrencies([
    { currency: 'RUB', periods: [empty, { ...empty, transfersOut: 10 }] },
    { currency: 'USD', periods: [empty] },
    { currency: 'KZT', periods: [{ ...empty, saving: 1 }] },
  ]), ['KZT', 'RUB']);
  assert.deepEqual(getMonthlyMetricCurrencies([]), []);
});

test('annual pie offers currencies with a positive category total', () => {
  assert.deepEqual(getAnnualCategoryCurrencies([
    { currency: 'RUB', expensesByCategory: [{ total: 0 }] },
    { currency: 'USD', expensesByCategory: [{ total: 8 }, { total: 0 }] },
    { currency: 'KZT', expensesByCategory: [] },
  ]), ['USD']);
  assert.deepEqual(getAnnualCategoryCurrencies([]), []);
});
