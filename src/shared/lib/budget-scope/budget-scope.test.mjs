import test from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetPath, scopedKey, resolveBudgetChoice, utcPeriod, parseBudgetSearch, validateBudgetSearch,
  readBudgetPreference, saveBudgetPreference,
} from './index.ts';

const personal = { kind: 'personal', userId: 'one' };
const family = { kind: 'group', userId: 'one', groupId: 'a'.repeat(24) };
test('scope paths and keys isolate owners, identities and explicit personal selection', () => {
  assert.equal(budgetPath(family, '/accounts'), `/groups/${family.groupId}/accounts`);
  assert.equal(budgetPath(personal, '/accounts'), '/accounts');
  assert.notDeepEqual(scopedKey(family, ['accounts']), scopedKey(personal, ['accounts']));
  assert.notDeepEqual(scopedKey(family, ['accounts']), scopedKey({ ...family, userId: 'two' }, ['accounts']));
  assert.equal(resolveBudgetChoice('personal', family.groupId), 'personal');
  assert.equal(resolveBudgetChoice(undefined, family.groupId), family.groupId);
  assert.equal(resolveBudgetChoice('//evil', family.groupId), 'personal');
});

test('preferences are identity-specific and storage failure keeps explicit URL selection usable', () => {
  const original = globalThis.window;
  const values = new Map();
  try {
    globalThis.window = {
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      },
    };
    saveBudgetPreference('one', family.groupId);
    saveBudgetPreference('two', 'personal');
    assert.equal(readBudgetPreference('one'), family.groupId);
    assert.equal(readBudgetPreference('two'), 'personal');
    Object.defineProperty(globalThis.window, 'localStorage', {
      get: () => {
        throw new Error('Storage blocked');
      },
    });
    assert.doesNotThrow(() => saveBudgetPreference('one', 'personal'));
    assert.equal(readBudgetPreference('one'), null);
    assert.equal(resolveBudgetChoice(family.groupId, readBudgetPreference('one')), family.groupId);
    assert.equal(resolveBudgetChoice(undefined, readBudgetPreference('one')), 'personal');
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});
test('UTC calendar periods include the last full day independently of local timezone', () => {
  assert.deepEqual(utcPeriod({ fromDate: '2024-02-01', toDate: '2024-02-29' }), {
    fromDate: '2024-02-01T00:00:00.000Z', toDate: '2024-02-29T23:59:59.999Z',
  });
});

test('budget URLs preserve numeric ObjectIds and tolerate malformed values', () => {
  const numericId = '123456789012345678901234';
  const resolveURL = (url) => {
    const parsed = parseBudgetSearch(new URL(url, 'https://example.test').search);
    return resolveBudgetChoice(validateBudgetSearch(parsed).budget, family.groupId);
  };
  assert.equal(resolveURL('/main?budget=123'), 'personal');
  assert.equal(resolveURL(`/main?budget=${numericId}`), numericId);
  assert.equal(resolveURL(`/main?budget=${encodeURIComponent(JSON.stringify(numericId))}`), numericId);
  assert.equal(resolveURL('/main?budget=[]'), 'personal');
  assert.equal(resolveURL('/main?budget=%7B%22x%22%3A1%7D'), 'personal');
  assert.equal(resolveURL('/main?budget=personal'), 'personal');
  assert.equal(resolveURL('/main'), family.groupId);
  assert.equal(resolveURL(`/main?budget=${numericId}&budget=personal`), 'personal');
  assert.deepEqual(validateBudgetSearch({ budget: [] }), { budget: 'personal' });
  assert.deepEqual(validateBudgetSearch({ budget: {} }), { budget: 'personal' });
  assert.deepEqual(validateBudgetSearch({}), {});
  assert.deepEqual({ ...parseBudgetSearch('?redirect=%2Fjoin&other=123') }, { redirect: '/join', other: 123 });
});
