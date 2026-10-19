import assert from 'node:assert/strict';
import test from 'node:test';
import { createPendingInvitationStore } from './pending-invitation.ts';

test('stores a tab-local invitation, preserves initial TTL and clears at its boundary', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  let now = 1000;
  const store = createPendingInvitationStore(() => storage, () => now);
  assert.equal(store.set('A'.repeat(43)), true);
  now += 29 * 60 * 1000;
  assert.equal(store.read()?.token, 'A'.repeat(43));
  const reloaded = createPendingInvitationStore(() => storage, () => now);
  assert.equal(reloaded.read()?.token, 'A'.repeat(43));
  now += 60 * 1000;
  assert.equal(reloaded.read(), null);
  assert.equal(values.size, 0);
  store.clear();
});

test('memory fallback, invalid replacement, and preview expiry never extend lifetime', () => {
  let now = 1000;
  const store = createPendingInvitationStore(() => {
    throw new Error('blocked');
  }, () => now);
  store.set('B'.repeat(43));
  assert.equal(store.read()?.persistent, false);
  store.shorten(now + 2000);
  now += 2000;
  assert.equal(store.read(), null);
  store.set('C'.repeat(43));
  assert.equal(store.set('invalid'), false);
  assert.equal(store.read(), null);
});

test('captures and removes fragment before storage without leaking the secret into the cleaned URL', async () => {
  const { captureInvitationFragment, pendingInvitation } = await import('./pending-invitation.ts');
  const calls = [];
  const originalWindow = globalThis.window;
  globalThis.window = {
    location: { pathname: '/join', search: '', hash: `#token=${'D'.repeat(43)}` },
    history: { state: {}, replaceState: (...args) => calls.push(args[2]) },
    get sessionStorage() {
      throw new Error('unavailable');
    },
  };
  try {
    captureInvitationFragment();
    assert.deepEqual(calls, ['/join']);
    assert.equal(pendingInvitation.read()?.token, 'D'.repeat(43));
    pendingInvitation.clear();
    assert.equal(pendingInvitation.read(), null);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('global expiry removes storage without join polling and bootstrap restores the remaining deadline', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const original = createPendingInvitationStore(() => storage);
  original.set('E'.repeat(43));
  context.mock.timers.tick(10 * 60 * 1000);
  const reloaded = createPendingInvitationStore(() => storage);
  assert.equal(reloaded.read()?.token, 'E'.repeat(43));
  context.mock.timers.tick(20 * 60 * 1000);
  assert.equal(values.size, 0);
  assert.equal(reloaded.read(), null);
});

test('replacement and shortened expiry each keep one timer and never clear a newer invitation early', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
  let scheduled = 0;
  let cancelled = 0;
  const schedule = (callback, delay) => {
    scheduled += 1;
    const timer = setTimeout(callback, delay);
    return () => {
      cancelled += 1;
      clearTimeout(timer);
    };
  };
  const store = createPendingInvitationStore(() => {
    throw new Error('blocked');
  }, Date.now, schedule);
  store.set('F'.repeat(43));
  store.read();
  store.read();
  assert.equal(scheduled, 1);
  context.mock.timers.tick(10 * 60 * 1000);
  store.set('G'.repeat(43));
  assert.equal(cancelled, 1);
  context.mock.timers.tick(20 * 60 * 1000);
  assert.equal(store.read()?.token, 'G'.repeat(43));
  store.shorten(Date.now() + 5000);
  assert.equal(scheduled, 3);
  context.mock.timers.tick(5000);
  assert.equal(store.read(), null);
});
