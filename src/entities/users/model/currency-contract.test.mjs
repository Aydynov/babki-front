import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const loadSchemas = async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    return await server.ssrLoadModule('/src/entities/users/model/schemas.ts');
  } finally {
    await server.close();
  }
};

const baseUser = {
  _id: '507f1f77bcf86cd799439011',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
  firstName: 'Иван',
  lastName: 'Петров',
  email: 'user@example.ru',
  defaultCurrency: 'RUB',
};

test('requires default currency and accepts nullable default account', async () => {
  const schemas = await loadSchemas();

  assert.ok(schemas.userSchema, 'userSchema must be exported');
  assert.equal(schemas.userSchema.safeParse({
    ...baseUser,
    defaultAccountId: null,
  }).success, true);
  assert.equal(schemas.userSchema.safeParse({
    ...baseUser,
    defaultAccountId: '507f191e810c19729de860ea',
  }).success, true);
  assert.equal(schemas.userSchema.safeParse({
    ...baseUser,
    defaultCurrency: undefined,
    defaultAccountId: null,
  }).success, false);
  assert.equal(schemas.userSchema.safeParse({
    ...baseUser,
    defaultAccountId: 'not-an-object-id',
  }).success, false);
});
