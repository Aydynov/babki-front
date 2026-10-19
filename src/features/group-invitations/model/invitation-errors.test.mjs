import assert from 'node:assert/strict';
import test from 'node:test';
import { invitationRetryAfter } from './invitation-errors.ts';

test('shared preview/accept Retry-After accepts seconds and HTTP dates with conservative fallback', () => {
  assert.equal(invitationRetryAfter({ response: { status: 429, headers: { 'retry-after': '42' } } }), 42);
  assert.equal(invitationRetryAfter({
    response: {
      status: 429, headers: { get: () => new Date(120000).toUTCString() },
    },
  }, 100000), 20);
  assert.equal(invitationRetryAfter({ response: { status: 429 } }), 60);
  assert.equal(invitationRetryAfter({ response: { status: 503 } }), 0);
});
