import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('plans and debts authorize the record author, group owner or transaction manager', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { BudgetProvider, useCanManageRecord } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
    const permissions = {
      manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
    };
    const scope = { kind: 'group', userId: 'viewer', groupId: 'family' };
    const check = (author, role, overrides = {}, activeScope = scope) => {
      function Probe() {
        return createElement('span', null, String(useCanManageRecord(author)));
      }
      return renderToString(createElement(
        BudgetProvider,
        {
          value: {
            scope: activeScope,
            title: 'Семья',
            group: {
              id: 'family',
              name: 'Семья',
              role,
              permissions: { ...permissions, ...overrides },
            },
          },
        },
        createElement(Probe, { author }),
      )).includes('true');
    };
    assert.equal(check('viewer', 'member'), true);
    assert.equal(check('spouse', 'member'), false);
    assert.equal(check('spouse', 'owner'), true);
    assert.equal(check('spouse', 'member', { manageTransactions: true }), true);
    const settingsOnly = { manageAccounts: true, manageCategories: true, manageLimits: true };
    assert.equal(check('spouse', 'member', settingsOnly), false);
    assert.equal(check(undefined, 'member'), false);
    assert.equal(check(undefined, 'member', {}, { kind: 'personal', userId: 'viewer' }), true);
  } finally {
    await server.close();
  }
});
