import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChartCurrency } from './resolve-chart-currency.ts';

test('uses ISO order initially independent of a removed profile default', () => {
  assert.equal(resolveChartCurrency(undefined, ['USD', 'RUB']), 'RUB');
});

test('uses ISO order when the default currency has no data', () => {
  assert.equal(resolveChartCurrency(undefined, ['USD', 'EUR']), 'EUR');
});

test('retains the selected currency while it has data', () => {
  assert.equal(resolveChartCurrency('USD', ['RUB', 'USD']), 'USD');
});

test('falls back when the selected currency disappears', () => {
  assert.equal(resolveChartCurrency('USD', ['EUR', 'RUB']), 'EUR');
  assert.equal(resolveChartCurrency('USD', ['EUR', 'KZT']), 'EUR');
});

test('has no selection when there are no currencies with data', () => {
  assert.equal(resolveChartCurrency('USD', []), undefined);
});
