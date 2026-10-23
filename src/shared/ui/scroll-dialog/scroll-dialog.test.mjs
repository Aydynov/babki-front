import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('shared dialog layout preserves caller content, actions and accessible close state', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { ScrollDialog } = await server.ssrLoadModule('/src/shared/ui/scroll-dialog/index.ts');
    const html = renderToStaticMarkup(createElement(
      ScrollDialog.Base,
      { open: true },
      createElement(ScrollDialog.Layout, {
        title: 'Сведения о записи',
        closeLabel: 'Закрыть сведения',
        closeDisabled: true,
        onClose() {},
        actions: createElement('button', { type: 'submit', form: 'record-form' }, 'Применить'),
      }, createElement('form', { id: 'record-form' }, createElement('input', { name: 'description' }))),
    ));
    assert.match(html, /Сведения о записи/);
    const closeButton = html.match(/<button[^>]*aria-label="Закрыть сведения"[^>]*>/)?.[0];
    assert.ok(closeButton);
    assert.match(closeButton, / disabled=""/);
    assert.match(html, /form="record-form"/);
    assert.match(html, /name="description"/);
    assert.match(html, /Применить/);
    assert.ok(html.indexOf('name="description"') < html.indexOf('Применить'));

    const readOnly = renderToStaticMarkup(createElement(
      ScrollDialog.Base,
      { open: true },
      createElement(ScrollDialog.Layout, {
        title: 'Просмотр',
        closeLabel: 'Закрыть просмотр',
        onClose() {},
      }, 'Содержимое без действий'),
    ));
    assert.match(readOnly, /Содержимое без действий/);
    assert.equal(readOnly.match(/<button\b/g)?.length, 1);
    const enabledClose = readOnly.match(/<button[^>]*aria-label="Закрыть просмотр"[^>]*>/)?.[0];
    assert.ok(enabledClose);
    assert.doesNotMatch(enabledClose, / disabled=""/);
  } finally {
    await server.close();
  }
});
