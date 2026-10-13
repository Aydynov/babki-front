// Run: node --test src/widgets/accounts/accounts-widget.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');

test('main dashboard composes the unified accounts widget', async () => {
  const [widget, mainPage, row] = await Promise.all([
    read('./ui/accounts.tsx'),
    read('../../pages/main/ui/main-page.tsx'),
    read('./ui/account-row.tsx'),
  ]);

  assert.match(widget, /accountsQueryOptions\.findAll/);
  assert.match(widget, /ManageAccountsButton/);
  assert.match(row, /account\.currency/);
  assert.match(mainPage, /import \{ Accounts \} from '@\/widgets\/accounts'/);
  assert.doesNotMatch(mainPage, /@\/widgets\/(balance|savings)/);
});

test('account details and the existing expansion have independent entry points', async () => {
  const [widget, row, details, mainPage] = await Promise.all([
    read('./ui/accounts.tsx'), read('./ui/account-row.tsx'),
    read('./ui/account-details-dialog.tsx'), read('../../pages/main/ui/main-page.tsx'),
  ]);
  assert.match(row, /onDetailsOpen/);
  assert.match(row, /Collapsible.Trigger/);
  assert.match(row, /page: 1, limit: 10/);
  assert.match(widget, /selectedAccountId/);
  assert.match(details, /transactionsQueryOptions.accountHistory/);
  assert.match(details, /transfersQueryOptions.accountHistory/);
  assert.match(details, /CreateTransferButton/);
  assert.doesNotMatch(mainPage, /widgets\/transfers|<Transfers/);
});

test('transfer creation waits for account eligibility before freezing initial form values', async () => {
  const transferButtons = await read('../../features/manage-transfer/ui/transfer-dialogs.tsx');
  const createButton = transferButtons.slice(transferButtons.indexOf('export const CreateTransferButton'));
  assert.match(createButton, /disabled=\{accountsQuery\.isLoading \|\| !accountsQuery\.data\}/);
});

test('account details reuses account management scoped to the selected account', async () => {
  const [details, management] = await Promise.all([
    read('./ui/account-details-dialog.tsx'),
    read('../../features/manage-accounts/ui/manage-accounts-button.tsx'),
  ]);
  assert.match(details, /<ManageAccountsButton accountId=\{account\._id\}/);
  assert.match(management, /accounts\.filter\(\(account\) => account\._id === accountId\)/);
  assert.match(management, /!accountId && \(/);
  assert.match(management, /onUnavailable\?\.\(\)/);
});
