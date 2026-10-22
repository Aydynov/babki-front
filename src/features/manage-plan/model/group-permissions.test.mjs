import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

test('plans and debts authorize the record author, space owner or transaction manager', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { BudgetProvider, useCanManageRecord } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
    const permissions = {
      manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
    };
    const scope = { userId: 'viewer', spaceId: 'family' };
    const check = (author, role, overrides = {}, participantId = undefined, activeScope = scope) => {
      function Probe() {
        return createElement('span', null, String(useCanManageRecord(author, participantId)));
      }
      return renderToString(createElement(
        BudgetProvider,
        {
          value: {
            scope: activeScope,
            title: 'Семья',
            space: {
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
    assert.equal(check('spouse', 'member', {}, 'viewer'), true);
    assert.equal(check('spouse', 'member', {}, 'other'), false);
    // Reassignment checks omit participantId, so participant status does not grant that action.
    assert.equal(check('spouse', 'member', { manageTransactions: false }), false);
    assert.equal(check('spouse', 'owner'), true);
    assert.equal(check('spouse', 'member', { manageTransactions: true }), true);
    const settingsOnly = { manageAccounts: true, manageCategories: true, manageLimits: true };
    assert.equal(check('spouse', 'member', settingsOnly), false);
    assert.equal(check(undefined, 'member'), false);
  } finally {
    await server.close();
  }
});
