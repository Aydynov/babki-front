import assert from 'node:assert/strict';
import test from 'node:test';
import { FieldApi, FormApi } from '@tanstack/react-form';

const modelPromise = import('./expense-form.ts').catch(() => ({}));

const validItem = {
  id: 'item-1',
  name: 'Молоко',
  quantity: '2',
  price: '89.90',
};

test('creates fresh form values for the supplied local date', async () => {
  const model = await modelPromise;

  assert.equal(typeof model.getDefaultExpenseFormValues, 'function');
  assert.deepEqual(
    model.getDefaultExpenseFormValues?.(new Date(2026, 7, 8)),
    {
      accountId: '',
      categoryId: '',
      amount: '',
      transactionDate: '2026-08-08',
      merchant: '',
      description: '',
      items: [],
    },
  );
});

test('validates complete items and rejects fractional quantities', async () => {
  const model = await modelPromise;

  assert.equal(model.isExpenseItemValid?.(validItem), true);
  assert.equal(model.isExpenseItemValid?.({ ...validItem, quantity: '1.5' }), false);
  assert.equal(model.isExpenseItemValid?.({ ...validItem, name: '  ' }), false);
});

test('changes integer quantities by one without going below one', async () => {
  const model = await modelPromise;

  assert.equal(model.changeExpenseItemQuantity?.('2', 1), '3');
  assert.equal(model.changeExpenseItemQuantity?.('2', -1), '1');
  assert.equal(model.changeExpenseItemQuantity?.('1', -1), '1');
});

test('sums rounded item prices without using quantities', async () => {
  const model = await modelPromise;

  assert.equal(model.calculateExpenseItemsTotal?.([
    {
      ...validItem,
      quantity: '5',
      price: '0.1',
    },
    {
      ...validItem,
      id: 'item-2',
      quantity: 'invalid',
      price: '0.2',
    },
  ]), '0.3');
  assert.equal(model.calculateExpenseItemsTotal?.([
    { ...validItem, quantity: 'invalid', price: 'invalid' },
  ]), '');
  assert.equal(model.calculateExpenseItemsTotal?.([
    { ...validItem, quantity: '1', price: '1.005' },
  ]), '1.01');
});

test('preserves a nonzero manual amount and resets it with zero or an empty value', async () => {
  const model = await modelPromise;
  const items = [{ ...validItem, quantity: '2', price: '50' }];

  assert.deepEqual(model.applyAmountInput?.('150', items), {
    amount: '150',
    amountOverridden: true,
  });
  assert.deepEqual(model.applyAmountInput?.('0.00', items), {
    amount: '50',
    amountOverridden: false,
  });
  assert.deepEqual(model.applyAmountInput?.('', items), {
    amount: '50',
    amountOverridden: false,
  });
  assert.deepEqual(model.applyAmountInput?.('', []), {
    amount: '',
    amountOverridden: false,
  });
});

test('requires a description or valid items and rejects every invalid present item', async () => {
  const model = await modelPromise;
  const base = {
    accountId: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439011',
    amount: '100',
    transactionDate: '2026-08-08',
    merchant: '',
    description: '',
    items: [],
  };

  assert.equal(model.expenseFormSchema?.safeParse({
    ...base,
    description: 'Продукты',
  }).success, true);
  assert.equal(model.expenseFormSchema?.safeParse(base).success, false);
  assert.equal(model.expenseFormSchema?.safeParse({
    ...base,
    description: 'Продукты',
    items: [{ ...validItem, quantity: '1.5' }],
  }).success, false);
});

test('validates strict ISO calendar dates including four-digit years below 100', async () => {
  const model = await modelPromise;
  const schema = model.expenseFieldSchemas?.transactionDate;

  assert.equal(schema?.safeParse('2024-02-29').success, true);
  assert.equal(schema?.safeParse('2026-02-29').success, false);
  assert.equal(schema?.safeParse('2026-2-9').success, false);
  assert.equal(schema?.safeParse('0099-01-01').success, true);
  assert.equal(schema?.safeParse('').error?.issues[0]?.message, 'required');
});

test('category stays error-free until submit validation', async () => {
  const model = await modelPromise;

  assert.ok(
    model.expenseCategoryFieldValidators,
    'category interaction validators must be exported',
  );

  const form = new FormApi({
    defaultValues: model.getDefaultExpenseFormValues?.(new Date(2026, 7, 8)),
    validators: { onSubmit: model.expenseFormSchema },
  });
  const categoryField = new FieldApi({
    form,
    name: 'categoryId',
    validators: model.expenseCategoryFieldValidators,
  });
  const amountField = new FieldApi({
    form,
    name: 'amount',
    validators: { onBlur: model.expenseFieldSchemas.amount },
  });
  const unmountForm = form.mount();
  const unmountCategory = categoryField.mount();
  const unmountAmount = amountField.mount();

  try {
    categoryField.handleBlur();

    assert.deepEqual(categoryField.state.meta.errors, []);
    assert.deepEqual(amountField.state.meta.errors, []);

    categoryField.handleChange('507f1f77bcf86cd799439011');
    assert.deepEqual(categoryField.state.meta.errors, []);

    categoryField.handleChange('');
    assert.deepEqual(categoryField.state.meta.errors, []);

    await form.handleSubmit();
    assert.equal(categoryField.state.meta.errors[0]?.message, 'required');
  } finally {
    unmountAmount();
    unmountCategory();
    unmountForm();
  }
});

test('handleSubmit reveals every invalid field after an earlier blur error', async () => {
  const model = await modelPromise;
  let submitCount = 0;

  assert.equal(typeof model.getExpenseDescriptionValidationError, 'function');

  const form = new FormApi({
    defaultValues: model.getDefaultExpenseFormValues?.(new Date(2026, 7, 8)),
    ...model.expenseFormValidationOptions,
    onSubmit: () => {
      submitCount += 1;
    },
  });
  const categoryField = new FieldApi({
    form,
    name: 'categoryId',
    validators: model.expenseCategoryFieldValidators,
  });
  const amountField = new FieldApi({
    form,
    name: 'amount',
    validators: { onBlur: model.expenseFieldSchemas.amount },
  });
  const descriptionField = new FieldApi({
    form,
    name: 'description',
    validators: {
      onBlur: ({ value }) => model.getExpenseDescriptionValidationError?.(
        value,
        form.state.values.items,
      ),
    },
  });
  const unmountForm = form.mount();
  const unmountCategory = categoryField.mount();
  const unmountAmount = amountField.mount();
  const unmountDescription = descriptionField.mount();

  try {
    amountField.handleBlur();
    assert.deepEqual(categoryField.state.meta.errors, []);

    await form.handleSubmit();
    const descriptionErrorCodes = descriptionField.state.meta.errors.map((error) => (
      typeof error === 'string' ? error : error.message
    ));

    assert.equal(categoryField.state.meta.errors[0]?.message, 'required');
    assert.ok(amountField.state.meta.errors.length > 0);
    assert.ok(descriptionErrorCodes.includes('contentRequired'));
    assert.equal(submitCount, 0);
  } finally {
    unmountDescription();
    unmountAmount();
    unmountCategory();
    unmountForm();
  }
});

test('maps trimmed form values to the existing expense contract', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.mapCreateExpenseDto?.({
    accountId: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439011',
    amount: '179.80',
    transactionDate: '2026-08-08',
    merchant: '  Магазин  ',
    description: '   ',
    items: [validItem],
  }), {
    accountId: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439011',
    amount: 179.8,
    transactionDate: '2026-08-08',
    merchant: 'Магазин',
    description: undefined,
    items: [{ name: 'Молоко', quantity: 2, price: 89.9 }],
  });
});

const expenseFixture = {
  _id: '507f1f77bcf86cd799439012',
  accountId: '507f1f77bcf86cd799439013',
  snapshotId: '507f1f77bcf86cd799439014',
  amount: 179.8,
  transactionDate: '2026-08-08T10:30:00.000Z',
  description: '  Продукты  ',
  merchant: '  Магазин  ',
  type: 'expense',
  category: {
    _id: '507f1f77bcf86cd799439011',
    name: 'Продукты',
    color: '#ffffff',
    isArchived: false,
  },
  items: [
    { name: 'Молоко', quantity: 2, price: 89.9 },
    { name: 'Хлеб', quantity: 3, price: 89.9 },
  ],
  createdAt: '2026-08-08T10:30:00.000Z',
  updatedAt: '2026-08-08T10:30:00.000Z',
};

test('prefills editable values from an existing expense', async () => {
  const model = await modelPromise;
  const values = model.getEditExpenseFormValues?.(expenseFixture);

  assert.equal(typeof model.getEditExpenseFormValues, 'function');
  assert.deepEqual({
    ...values,
    items: values?.items.map(({ id, ...item }) => ({
      hasLocalId: typeof id === 'string' && id.length > 0,
      ...item,
    })),
  }, {
    accountId: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439011',
    amount: '179.8',
    transactionDate: '2026-08-08',
    merchant: '  Магазин  ',
    description: '  Продукты  ',
    items: [
      {
        hasLocalId: true,
        name: 'Молоко',
        quantity: '2',
        price: '89.9',
      },
      {
        hasLocalId: true,
        name: 'Хлеб',
        quantity: '3',
        price: '89.9',
      },
    ],
  });
});

test('derives automatic amount mode with minor-unit price comparison', async () => {
  const model = await modelPromise;

  assert.equal(typeof model.isExpenseAmountOverridden, 'function');
  assert.equal(model.isExpenseAmountOverridden?.('179.80', [
    { ...validItem, price: '89.9' },
    { ...validItem, id: 'item-2', price: '89.9' },
  ]), false);
  assert.equal(model.isExpenseAmountOverridden?.('200', [
    { ...validItem, price: '89.9' },
    { ...validItem, id: 'item-2', price: '89.9' },
  ]), true);
  assert.equal(model.isExpenseAmountOverridden?.('0.3', [
    { ...validItem, price: '0.1' },
    { ...validItem, id: 'item-2', price: '0.2' },
  ]), false);
});

test('maps complete edit values and explicitly clears optional content', async () => {
  const model = await modelPromise;
  const values = {
    accountId: '507f1f77bcf86cd799439013',
    categoryId: ' 507f1f77bcf86cd799439011 ',
    amount: '179.80',
    transactionDate: '2026-08-08',
    merchant: '   ',
    description: '',
    items: [],
  };
  const payload = model.mapUpdateExpenseDto?.(values);

  assert.equal(typeof model.mapUpdateExpenseDto, 'function');
  assert.deepEqual(payload, {
    categoryId: '507f1f77bcf86cd799439011',
    amount: 179.8,
    merchant: '',
    description: '',
    items: [],
  });
  assert.equal(Object.hasOwn(payload ?? {}, 'transactionDate'), false);
  assert.equal(Object.hasOwn(payload ?? {}, 'accountId'), false);
});

test('maps edited item numbers and trimmed text', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.mapUpdateExpenseDto?.({
    accountId: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439011',
    amount: '100',
    transactionDate: '2026-08-08',
    merchant: '  Магазин  ',
    description: '  Покупки  ',
    items: [{ ...validItem, name: '  Молоко  ' }],
  }), {
    categoryId: '507f1f77bcf86cd799439011',
    amount: 100,
    merchant: 'Магазин',
    description: 'Покупки',
    items: [{ name: 'Молоко', quantity: 2, price: 89.9 }],
  });
});

test('offers active categories plus only the current archived category', async () => {
  const model = await modelPromise;
  const active = {
    _id: 'active',
    name: 'Активная',
    isArchived: false,
  };
  const otherArchived = {
    _id: 'other-archived',
    name: 'Другая архивная',
    isArchived: true,
  };
  const currentArchived = {
    _id: 'current-archived',
    name: 'Текущая архивная',
    isArchived: true,
  };

  assert.equal(typeof model.getExpenseCategoryOptions, 'function');
  assert.deepEqual(
    model.getExpenseCategoryOptions?.(
      [active, otherArchived],
      currentArchived,
    ),
    [currentArchived, active],
  );
  assert.deepEqual(
    model.getExpenseCategoryOptions?.([active], active),
    [active],
  );
});

const accountFixture = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Основной счёт',
  type: 'balance',
  currency: 'RUB',
  archivedAt: null,
};

test('initializes only an active loaded default account and preserves explicit selection', async () => {
  const model = await modelPromise;
  const otherAccount = {
    ...accountFixture,
    _id: '507f1f77bcf86cd799439099',
    name: 'Доллары',
    currency: 'USD',
  };

  assert.equal(typeof model.getExpenseInitialAccountId, 'function');
  assert.equal(
    model.getExpenseInitialAccountId?.([accountFixture, otherAccount], accountFixture._id),
    accountFixture._id,
  );
  assert.equal(
    model.getExpenseInitialAccountId?.([accountFixture, otherAccount], otherAccount._id),
    otherAccount._id,
  );
});

test('leaves account empty when the default is missing or archived', async () => {
  const model = await modelPromise;

  assert.equal(model.getExpenseInitialAccountId?.([accountFixture], null), '');
  assert.equal(model.getExpenseInitialAccountId?.([accountFixture], '507f1f77bcf86cd799439099'), '');
  assert.equal(model.getExpenseInitialAccountId?.([
    { ...accountFixture, archivedAt: '2026-08-09T00:00:00.000Z' },
  ], accountFixture._id), '');
});

test('keeps archived account available as immutable editing context', async () => {
  const model = await modelPromise;
  const archivedAccount = {
    ...accountFixture,
    archivedAt: '2026-08-09T00:00:00.000Z',
  };

  assert.equal(typeof model.getExpenseAccountContext, 'function');
  assert.deepEqual(
    model.getExpenseAccountContext?.([archivedAccount], archivedAccount._id),
    archivedAccount,
  );
});

test('validates amount and every item price using the account currency precision', async () => {
  const model = await modelPromise;
  const values = {
    accountId: accountFixture._id,
    categoryId: '507f1f77bcf86cd799439011',
    amount: '100.25',
    transactionDate: '2026-08-08',
    merchant: '',
    description: 'Покупки',
    items: [{ ...validItem, price: '10.50' }],
  };

  assert.equal(typeof model.hasValidExpenseMoneyPrecision, 'function');
  assert.equal(model.hasValidExpenseMoneyPrecision?.(values, 'RUB'), true);
  assert.equal(model.hasValidExpenseMoneyPrecision?.({ ...values, amount: '100.251' }, 'RUB'), false);
  assert.equal(model.hasValidExpenseMoneyPrecision?.({
    ...values,
    items: [{ ...validItem, price: '10.501' }],
  }, 'RUB'), false);
  assert.equal(model.hasValidExpenseMoneyPrecision?.({ ...values, amount: '100.25' }, 'JPY'), false);
  assert.equal(model.hasValidExpenseMoneyPrecision?.({
    ...values,
    amount: '100',
    items: [{ ...validItem, price: '10' }],
  }, 'JPY'), true);
});
