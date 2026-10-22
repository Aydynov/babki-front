import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { AxiosError } from 'axios';

test('reports backend validation messages and preserves HTTP status precedence', async () => {
  const server = await createServer({
    appType: 'custom', logLevel: 'silent', server: { middlewareMode: true },
  });
  try {
    const model = await server.ssrLoadModule('/src/shared/lib/form-errors/form-errors.ts');
    assert.equal(model.getMutationErrorMessage({
      message: 'Request failed with status code 400',
      response: { status: 400, data: { statusCode: 400, message: ['amount is invalid', 'account is required'] } },
    }), 'amount is invalid\naccount is required');
    assert.equal(model.getMutationErrorMessage({
      response: { status: 409, data: { statusCode: 409, message: 'Already cancelled' } },
    }), 'Already cancelled');
    const { getApiErrorStatus } = await server.ssrLoadModule('/src/shared/api/errors.ts');
    assert.equal(getApiErrorStatus({ response: { status: 403, data: { statusCode: 401 } } }), 403);
    assert.equal(getApiErrorStatus({ response: { data: { statusCode: 404 } } }), 404);
    assert.equal(getApiErrorStatus(new Error('offline')), undefined);
  } finally {
    await server.close();
  }
});

test('keeps financial error statuses rejected and accepts an empty 204 response', async () => {
  const server = await createServer({
    appType: 'custom', logLevel: 'silent', server: { middlewareMode: true },
  });
  try {
    const { apiClient } = await server.ssrLoadModule('/src/shared/api/client.ts');
    const { getApiErrorStatus } = await server.ssrLoadModule('/src/shared/api/errors.ts');
    await Promise.all([400, 401, 403, 404, 409, 503].map(async (status) => {
      await assert.rejects(apiClient.post('/spaces/507f1f77bcf86cd799439011/accounts', {}, {
        adapter: async (config) => {
          throw new AxiosError('Rejected', 'ERR_BAD_RESPONSE', config, undefined, {
            status, statusText: 'Rejected', headers: {}, config, data: { statusCode: status, message: 'Rejected' },
          });
        },
      }), (error) => getApiErrorStatus(error) === status);
    }));
    const response = await apiClient.post('/spaces/507f1f77bcf86cd799439011/accounts/account/archive', {}, {
      adapter: async (config) => ({
        status: 204, statusText: 'No Content', headers: {}, config, data: '',
      }),
    });
    assert.equal(response.status, 204);
    assert.equal(response.data, '');
  } finally {
    await server.close();
  }
});
