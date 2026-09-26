import assert from 'node:assert/strict';
import test from 'node:test';

const modelPromise = import('./auth-form.ts').catch(() => ({}));

test('requires trimmed registration identity and keeps only submitted auth fields', async () => {
  const model = await modelPromise;

  assert.ok(model.registerSchema, 'registerSchema must be exported');
  assert.equal(model.registerSchema.safeParse({
    firstName: '   ',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    defaultCurrency: 'RUB',
  }).success, false);

  assert.deepEqual(model.registerSchema.parse({
    firstName: '  Иван  ',
    lastName: '  Петров  ',
    email: '  user@example.ru  ',
    password: 'password',
    defaultCurrency: 'RUB',
    birthDate: '1990-01-01',
    notes: 'not submitted by the form',
  }), {
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    defaultCurrency: 'RUB',
  });
});

test('maps the registration form currency to the backend wire field', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.mapRegisterRequest?.({
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    defaultCurrency: 'USD',
  }), {
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    currency: 'USD',
  });
});

test('enforces auth email, password, name, and currency limits', async () => {
  const model = await modelPromise;
  const validRegistration = {
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    defaultCurrency: 'RUB',
  };

  assert.ok(model.loginSchema, 'loginSchema must be exported');
  assert.ok(model.registerSchema, 'registerSchema must be exported');
  assert.equal(model.loginSchema.safeParse({
    email: 'not-an-email',
    password: 'password',
  }).success, false);
  assert.equal(model.loginSchema.safeParse({
    email: 'user@example.ru',
    password: 'short',
  }).success, false);
  assert.equal(model.loginSchema.safeParse({
    email: 'user@example.ru',
    password: 'x'.repeat(129),
  }).success, false);
  assert.equal(model.registerSchema.safeParse({
    ...validRegistration,
    firstName: 'x'.repeat(101),
  }).success, false);
  assert.equal(model.registerSchema.safeParse({
    ...validRegistration,
    defaultCurrency: 'rub',
  }).success, false);
});

test('exposes stable validation codes and auth form defaults', async () => {
  const model = await modelPromise;

  assert.deepEqual(model.defaultLoginFormValues, {
    email: '',
    password: '',
  });
  assert.deepEqual(model.defaultRegisterFormValues, {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    defaultCurrency: 'RUB',
  });
  assert.equal(model.loginSchema.safeParse({
    email: 'invalid',
    password: 'password',
  }).error?.issues[0]?.message, 'email');
  assert.equal(model.loginSchema.safeParse({
    email: 'user@example.ru',
    password: 'short',
  }).error?.issues[0]?.message, 'passwordMin');
  assert.equal(model.registerSchema.safeParse({
    firstName: '',
    lastName: 'Петров',
    email: 'user@example.ru',
    password: 'password',
    defaultCurrency: 'RUB',
  }).error?.issues[0]?.message, 'required');
});

test('maps only known authentication status failures to specific messages', async () => {
  const model = await modelPromise;

  assert.equal(typeof model.getAuthMutationErrorKey, 'function');
  assert.equal(model.getAuthMutationErrorKey?.(
    { response: { status: 401 } },
    'login',
  ), 'auth.login.errors.credentials');
  assert.equal(model.getAuthMutationErrorKey?.(
    { response: { status: 409 } },
    'register',
  ), 'auth.register.errors.emailTaken');
  assert.equal(model.getAuthMutationErrorKey?.(
    { response: { status: 500 } },
    'login',
  ), 'auth.errors.generic');
});

test('maps stable auth validation codes to translation keys', async () => {
  const model = await modelPromise;

  assert.equal(typeof model.getAuthValidationKey, 'function');
  assert.equal(model.getAuthValidationKey?.('required'), 'validation.required');
  assert.equal(model.getAuthValidationKey?.('email'), 'auth.validation.email');
  assert.equal(model.getAuthValidationKey?.('passwordMin'), 'auth.validation.passwordMin');
  assert.equal(model.getAuthValidationKey?.('unknown'), undefined);
});
