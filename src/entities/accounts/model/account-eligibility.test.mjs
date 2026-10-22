import assert from 'node:assert/strict';
import test from 'node:test';

const eligibilityPromise = import('./account-eligibility.ts').catch(() => ({}));

const account = (overrides = {}) => ({
  _id: 'rub-balance',
  name: 'Основной',
  type: 'balance',
  currency: 'RUB',
  archivedAt: null,
  amount: 100,
  ...overrides,
});

test('filters archived accounts from operation choices', async () => {
  const eligibility = await eligibilityPromise;
  const active = account();
  const archived = account({ _id: 'archived', archivedAt: '2026-09-23T00:00:00.000Z' });

  assert.deepEqual(eligibility.getActiveAccounts?.([archived, active]), [active]);
  assert.equal(eligibility.getAccountStatus?.(active), 'active');
  assert.equal(eligibility.getAccountStatus?.(archived), 'archived');
});

test('validates non-negative initial amount with currency precision', async () => {
  const eligibility = await eligibilityPromise;

  assert.equal(eligibility.hasValidInitialAmount?.(0, 'RUB'), true);
  assert.equal(eligibility.hasValidInitialAmount?.(-1, 'RUB'), false);
  assert.equal(eligibility.hasValidInitialAmount?.(10.25, 'USD'), true);
  assert.equal(eligibility.hasValidInitialAmount?.(10.251, 'USD'), false);
  assert.equal(eligibility.hasValidInitialAmount?.(10.5, 'JPY'), false);
});

test('builds select options with archived and incompatible reasons', async () => {
  const eligibility = await eligibilityPromise;
  const accounts = [
    account(),
    account({ _id: 'archived', archivedAt: '2026-09-23T00:00:00.000Z' }),
    account({ _id: 'usd', currency: 'USD' }),
  ];

  assert.deepEqual(
    eligibility.getAccountSelectOptions?.(accounts, (item) => item.currency === 'RUB'),
    [
      { account: accounts[0], disabledReason: null },
      { account: accounts[1], disabledReason: 'archived' },
      { account: accounts[2], disabledReason: 'incompatible' },
    ],
  );
});
