import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('mandatory space paths and keys reject invalid context and isolate spaces and identities', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const {
      budgetPath, scopedKey, parseBudgetSearch, validateBudgetSearch, resolveBudgetChoice, utcPeriod,
    } = await server
      .ssrLoadModule('/src/shared/lib/budget-scope/index.ts');
    const scope = { userId: 'u', spaceId: 'a'.repeat(24) };
    assert.equal(budgetPath(scope, '/accounts'), `/spaces/${scope.spaceId}/accounts`);
    [undefined, {}, { userId: 'u', spaceId: 'bad' }].forEach((invalid) => {
      assert.throws(() => budgetPath(invalid, '/accounts'));
      assert.throws(() => scopedKey(invalid, ['accounts']));
    });
    assert.deepEqual(scopedKey(scope, ['accounts', { page: 2 }]), ['accounts', 'u', scope.spaceId, { page: 2 }]);
    assert.notDeepEqual(scopedKey(scope, ['accounts']), scopedKey({ ...scope, userId: 'v' }, ['accounts']));
    assert.notDeepEqual(scopedKey(scope, ['accounts']), scopedKey({ ...scope, spaceId: 'b'.repeat(24) }, ['accounts']));
    assert.deepEqual(utcPeriod({ fromDate: '2024-02-01', toDate: '2024-02-29' }), {
      fromDate: '2024-02-01T00:00:00.000Z', toDate: '2024-02-29T23:59:59.999Z',
    });
    const numeric = '123456789012345678901234';
    assert.equal(validateBudgetSearch(parseBudgetSearch(`?spaceId=${numeric}`)).spaceId, numeric);
    const repeated = parseBudgetSearch(`?spaceId=${numeric}&spaceId=${numeric}`);
    assert.equal(resolveBudgetChoice(validateBudgetSearch(repeated).spaceId), '');
    assert.equal(resolveBudgetChoice('personal'), '');
    assert.equal(resolveBudgetChoice(undefined, scope.spaceId), scope.spaceId);
  } finally {
    await server.close();
  }
});

test('restores only a confirmed identity space preference and lets invalid explicit URLs suppress it', async () => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  const originalWindow = globalThis.window;
  const values = new Map([['babki.budget.one', 'b'.repeat(24)]]);
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    const { readBudgetPreference, saveBudgetPreference, resolveBudgetChoice } = await server.ssrLoadModule(
      '/src/shared/lib/budget-scope/index.ts',
    );
    assert.equal(typeof readBudgetPreference, 'function');
    assert.equal(readBudgetPreference('one'), null);
    const id = 'a'.repeat(24);
    saveBudgetPreference('one', id);
    assert.equal(readBudgetPreference('one'), id);
    assert.equal(readBudgetPreference('two'), null);
    assert.equal(resolveBudgetChoice(undefined, id), id);
    assert.equal(resolveBudgetChoice('', id), '');
    assert.equal(resolveBudgetChoice('personal', id), '');
    saveBudgetPreference('one', null);
    assert.equal(readBudgetPreference('one'), null);
  } finally {
    globalThis.window = originalWindow;
    await server.close();
  }
});
