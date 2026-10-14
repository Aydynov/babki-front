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
    { currency: 'RUB', periods: [empty, { ...empty, expenses: 10 }] },
    { currency: 'USD', periods: [empty] },
    { currency: 'KZT', periods: [{ ...empty, saving: 1 }] },
  ]), ['KZT', 'RUB']);
  assert.deepEqual(getMonthlyMetricCurrencies([]), []);
  ['expenses', 'incomes', 'saving'].forEach((metric) => {
    assert.deepEqual(getMonthlyMetricCurrencies([
      { currency: 'USD', periods: [empty, { ...empty, [metric]: 10 }] },
    ]), ['USD']);
  });
  assert.deepEqual(getMonthlyMetricCurrencies([
    { currency: 'USD', periods: [{ ...empty, saving: -10 }] },
  ]), ['USD']);
});

test('monthly chart excludes currencies with only transfers or no activity', () => {
  const empty = {
    expenses: 0, incomes: 0, saving: 0, transfersIn: 0, transfersOut: 0,
  };
  assert.deepEqual(getMonthlyMetricCurrencies([
    { currency: 'RUB', periods: [empty, { ...empty, transfersOut: 10 }] },
    { currency: 'USD', periods: [{ ...empty, transfersIn: 10 }] },
    { currency: 'KZT', periods: [empty] },
    { currency: 'EUR', periods: [] },
  ]), []);
});

test('annual pie offers currencies with a positive category total', () => {
  assert.deepEqual(getAnnualCategoryCurrencies([
    { currency: 'RUB', expensesByCategory: [{ total: 0 }] },
    { currency: 'USD', expensesByCategory: [{ total: 8 }, { total: 0 }] },
    { currency: 'KZT', expensesByCategory: [] },
  ]), ['USD']);
  assert.deepEqual(getAnnualCategoryCurrencies([]), []);
});
