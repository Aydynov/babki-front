import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('shared money cards require currency instead of reading a locale-derived global', async () => {
  const [amountCard, listCard] = await Promise.all([
    readSource('../../ui/card-amount/card-amount.tsx'),
    readSource('../../ui/card-list/card-list.tsx'),
  ]);

  assert.doesNotMatch(amountCard, /getCurrentCurrencyCode/);
  assert.match(amountCard, /currency: CurrencyCode;/);
  assert.doesNotMatch(listCard, /getCurrentCurrencyCode/);
  assert.match(listCard, /currency: CurrencyCode;/);
});
