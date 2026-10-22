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
};

test('accepts user and auth responses without financial defaults', async () => {
  const schemas = await loadSchemas();
  assert.deepEqual(schemas.userSchema.parse(baseUser), {
    _id: baseUser._id,
    firstName: baseUser.firstName,
    lastName: baseUser.lastName,
    email: baseUser.email,
  });
});

test('rejects removed profile financial fields in outgoing changes', async () => {
  const schemas = await loadSchemas();
  assert.equal(schemas.updateUserSchema.safeParse({ defaultCurrency: 'RUB' }).success, false);
  assert.equal(schemas.updateUserSchema.safeParse({ defaultAccountId: null }).success, false);
  assert.deepEqual(schemas.updateUserSchema.parse({ firstName: 'Анна' }), { firstName: 'Анна' });
});
