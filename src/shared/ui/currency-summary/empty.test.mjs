import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('empty summaries explain missing data without inventing a currency row', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    await server.ssrLoadModule('/src/shared/lib/i18n/index.ts');
    const { CurrencySummary } = await server.ssrLoadModule('/src/shared/ui/currency-summary/currency-summary.tsx');
    const html = renderToString(createElement(CurrencySummary, { title: 'Доходы', rows: [] }));
    assert.match(html, /Данные отсутствуют/);
    assert.doesNotMatch(html, /RUB|USD|0,00/);
  } finally {
    await server.close();
  }
});
