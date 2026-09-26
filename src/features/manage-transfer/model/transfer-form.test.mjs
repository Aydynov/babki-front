import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./transfer-form.ts').catch(() => ({}));

const source = {
  _id: '507f1f77bcf86cd799439011',
  amount: 1000,
  currency: 'RUB',
  archivedAt: null,
};
const destination = {
  _id: '507f1f77bcf86cd799439012',
  amount: 50,
  currency: 'USD',
  archivedAt: null,
};

test('requires two distinct active accounts and excludes source from destinations', async () => {
  const model = await modelPromise;
  const archived = { ...destination, _id: '507f1f77bcf86cd799439013', archivedAt: '2026-09-01' };

  assert.deepEqual(
    model.getEligibleTransferDestinations?.([source, destination, archived], source._id),
    [destination],
  );
  assert.equal(model.transferFormSchema?.safeParse({
    sourceAccountId: source._id,
    destinationAccountId: source._id,
    sourceAmount: '100',
    destinationAmount: '100',
    transactionDate: '2026-09-23',
    description: '',
  }).success, false);
});

test('links same-currency amounts while leaving cross-currency amounts independent', async () => {
  const model = await modelPromise;

  assert.equal(model.syncTransferDestinationAmount?.('125.50', '10', 'RUB', 'RUB'), '125.50');
  assert.equal(model.syncTransferDestinationAmount?.('125.50', '10', 'RUB', 'USD'), '10');
});

test('validates each amount using its account currency and calculates directed rate', async () => {
  const model = await modelPromise;
  const values = {
    sourceAccountId: source._id,
    destinationAccountId: destination._id,
    sourceAmount: '900',
    destinationAmount: '10',
    transactionDate: '2026-09-23',
    description: '',
  };

  assert.equal(model.hasValidTransferPrecision?.(values, source, destination), true);
  assert.equal(model.hasValidTransferPrecision?.(
    { ...values, destinationAmount: '10.001' },
    source,
    destination,
  ), false);
  assert.equal(model.getTransferEffectiveRate?.('900', '10'), 1 / 90);
  assert.equal(model.getTransferEffectiveRate?.('0', '10'), null);
});

test('recovers from insufficient funds once the source amount is corrected', async () => {
  const model = await modelPromise;
  const values = {
    sourceAccountId: source._id,
    destinationAccountId: destination._id,
    sourceAmount: '1000.01',
    destinationAmount: '10',
    transactionDate: '2026-09-23',
    description: '',
  };

  assert.equal(model.getTransferSubmissionIssue?.(values, source, destination), 'insufficientFunds');
  assert.equal(model.getTransferSubmissionIssue?.({ ...values, sourceAmount: '999' }, source, destination), null);
  assert.equal(
    model.getTransferSubmissionIssue?.(values, source, destination, 900),
    null,
    'editing debits only the increase over the original amount',
  );
});

test('maps create and immutable edit payloads', async () => {
  const model = await modelPromise;
  const values = {
    sourceAccountId: source._id,
    destinationAccountId: destination._id,
    sourceAmount: '900',
    destinationAmount: '10',
    transactionDate: '2026-09-23',
    description: '  Обмен  ',
  };

  assert.deepEqual(model.mapCreateTransferDto?.(values), {
    sourceAccountId: source._id,
    destinationAccountId: destination._id,
    sourceAmount: 900,
    destinationAmount: 10,
    transactionDate: '2026-09-23',
    description: 'Обмен',
  });
  assert.deepEqual(model.mapUpdateTransferDto?.(values), {
    sourceAmount: 900,
    destinationAmount: 10,
    description: 'Обмен',
  });
  assert.deepEqual(model.mapUpdateTransferDto?.({ ...values, description: '   ' }), {
    sourceAmount: 900,
    destinationAmount: 10,
    description: '',
  });
});

test('allows archived accounts while editing historical transfers', async () => {
  const model = await modelPromise;
  const values = {
    sourceAccountId: source._id,
    destinationAccountId: destination._id,
    sourceAmount: '900',
    destinationAmount: '10',
    transactionDate: '2026-09-23',
    description: '',
  };

  assert.equal(model.getTransferSubmissionIssue?.(
    values,
    { ...source, archivedAt: '2026-09-24' },
    destination,
    900,
    true,
  ), null);
  assert.equal(model.getTransferSubmissionIssue?.(
    { ...values, sourceAmount: '2000', destinationAmount: '20' },
    source,
    destination,
    900,
    true,
    false,
  ), null, 'historical snapshot funds are validated by the backend');
});

test('recognizes the backend insufficient-funds validation error', async () => {
  const model = await modelPromise;

  assert.equal(model.isInsufficientTransferFundsError?.({
    response: { status: 400, data: { message: 'Insufficient source funds.' } },
  }), true);
  assert.equal(model.isInsufficientTransferFundsError?.({
    response: { status: 400, data: { message: 'Other validation error' } },
  }), false);
});
