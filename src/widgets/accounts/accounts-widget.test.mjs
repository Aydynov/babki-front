import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');

test('main dashboard composes the unified accounts widget', async () => {
  const [widget, mainPage] = await Promise.all([
    read('./ui/accounts.tsx'),
    read('../../pages/main/ui/main-page.tsx'),
  ]);

  assert.match(widget, /accountsQueryOptions\.findAll/);
  assert.match(widget, /ManageAccountsButton/);
  assert.match(widget, /account\.currency/);
  assert.match(mainPage, /import \{ Accounts \} from '@\/widgets\/accounts'/);
  assert.doesNotMatch(mainPage, /@\/widgets\/(balance|savings)/);
});
