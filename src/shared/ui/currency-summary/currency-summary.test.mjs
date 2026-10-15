// Run: node --test src/shared/ui/currency-summary/currency-summary.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const render = async (props) => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    await server.ssrLoadModule('/src/shared/lib/i18n/index.ts');
    const module = await server.ssrLoadModule('/src/shared/ui/currency-summary/index.ts');
    assert.equal(typeof module.CurrencySummary, 'function', 'CurrencySummary must present all currencies in one card');
    return renderToStaticMarkup(createElement(module.CurrencySummary, props));
  } finally {
    await server.close();
  }
};

test('shows independent full amounts, including zero, under one title', async () => {
  const html = await render({
    title: 'Доходы',
    rows: [
      { currency: 'RUB', value: 1234567890.12, diff: 0 },
      { currency: 'USD', value: 0, diff: 0 },
    ],
  });
  assert.equal((html.match(/data-slot="card"/g) ?? []).length, 1);
  assert.equal((html.match(/Доходы/g) ?? []).length, 1);
  assert.match(html, /RUB/);
  assert.match(html, /USD/);
  assert.match(html, /1\u00a0234\u00a0567\u00a0890,12/);
  assert.match(html, /0,00/);
  assert.doesNotMatch(html, /lucide-arrow/);
});

test('expense coloring reverses the assessment without reversing the sign or arrow', async () => {
  await Promise.all([0.2, -0.1].flatMap((diff) => [false, true].map(async (decreaseIsPositive) => {
    const html = await render({
      title: 'Расходы', decreaseIsPositive, rows: [{ currency: 'RUB', value: 120, diff }],
    });
    const positive = decreaseIsPositive ? diff < 0 : diff > 0;
    assert.match(html, new RegExp(positive ? 'text-success' : 'text-destructive'));
    assert.match(html, new RegExp(`lucide-arrow-${diff > 0 ? 'up' : 'down'}`));
    assert.match(html, new RegExp(diff > 0 ? '\\+20' : '-10'));
  })));
});
