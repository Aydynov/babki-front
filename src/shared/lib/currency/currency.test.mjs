import assert from 'node:assert/strict';
import test from 'node:test';

const currencyPromise = import('./index.ts').catch(() => ({}));

test('accepts supported ISO currencies and rejects unknown codes', async () => {
  const currency = await currencyPromise;

  assert.ok(currency.currencyCodeSchema, 'currencyCodeSchema must be exported');
  assert.equal(currency.currencyCodeSchema.safeParse('RUB').success, true);
  assert.equal(currency.currencyCodeSchema.safeParse('USD').success, true);
  assert.equal(currency.currencyCodeSchema.safeParse('rub').success, false);
  assert.equal(currency.currencyCodeSchema.safeParse('ZZZ').success, false);
});

test('resolves ISO minor units', async () => {
  const currency = await currencyPromise;

  assert.equal(typeof currency.getCurrencyMinorUnits, 'function');
  assert.equal(currency.getCurrencyMinorUnits?.('JPY'), 0);
  assert.equal(currency.getCurrencyMinorUnits?.('USD'), 2);
  assert.equal(currency.getCurrencyMinorUnits?.('KWD'), 3);
});

test('validates money precision for its explicit currency', async () => {
  const currency = await currencyPromise;

  assert.equal(typeof currency.hasValidMoneyPrecision, 'function');
  assert.equal(currency.hasValidMoneyPrecision?.(100, 'JPY'), true);
  assert.equal(currency.hasValidMoneyPrecision?.(100.5, 'JPY'), false);
  assert.equal(currency.hasValidMoneyPrecision?.(10.25, 'USD'), true);
  assert.equal(currency.hasValidMoneyPrecision?.(10.251, 'USD'), false);
  assert.equal(currency.hasValidMoneyPrecision?.(1.234, 'KWD'), true);
});

test('formats money with the supplied currency rather than locale currency', async () => {
  const currency = await currencyPromise;

  assert.equal(typeof currency.formatMoney, 'function');
  assert.equal(
    currency.formatMoney?.(1234.5, 'USD', 'ru-RU'),
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(1234.5),
  );
});

test('orders default currency first and the remainder by ISO code', async () => {
  const currency = await currencyPromise;

  assert.equal(typeof currency.sortCurrencyCodes, 'function');
  assert.deepEqual(
    currency.sortCurrencyCodes?.(['USD', 'EUR', 'RUB', 'USD'], 'RUB'),
    ['RUB', 'EUR', 'USD'],
  );
  assert.deepEqual(
    currency.sortCurrencyCodes?.(['RUB', 'USD', 'EUR'], 'USD'),
    ['USD', 'EUR', 'RUB'],
  );
});
