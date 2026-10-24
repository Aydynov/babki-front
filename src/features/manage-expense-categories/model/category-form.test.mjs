import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('validates one category against active and archived names and preserves clearing description', async () => {
  const server = await createServer({
    configFile: false,
    cacheDir: 'node_modules/.vite-category-form-test',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
  try {
    const { getCategoryFormSchema } = await server.ssrLoadModule(
      '/src/features/manage-expense-categories/model/validation.ts',
    );
    const categories = [{ _id: 'own', name: 'Еда' }, { _id: 'archived', name: 'Архив', isArchived: true }];
    const schema = getCategoryFormSchema(categories, 'own');
    const values = { name: ' Еда ', color: '#c94f4f', description: '' };
    assert.deepEqual(schema.parse(values), { name: 'Еда', color: '#C94F4F', description: '' });
    [
      { name: ' ' }, { name: 'x'.repeat(101) }, { name: ' АРХИВ ' },
      { color: '' }, { color: '#ffffff' }, { description: 'x'.repeat(501) },
    ].forEach((patch) => assert.equal(schema.safeParse({ ...values, ...patch }).success, false));
    assert.equal(schema.safeParse({ ...values, name: 'x'.repeat(100), description: 'x'.repeat(500) }).success, true);
    assert.equal(getCategoryFormSchema(categories).safeParse(values).success, false);
  } finally {
    await server.close();
  }
});
