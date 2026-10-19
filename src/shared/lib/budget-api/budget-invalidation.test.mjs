import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { createServer } from 'vite';

const userId = '507f1f77bcf86cd799439011';
const otherUserId = '507f1f77bcf86cd799439012';
const groupId = '507f1f77bcf86cd799439013';
const otherGroupId = '507f1f77bcf86cd799439014';
const debtId = '507f1f77bcf86cd799439015';
const repaymentId = '507f1f77bcf86cd799439016';
const scope = { kind: 'group', userId, groupId };

const createClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: 3 } },
});

const withServer = async (run) => {
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    await run(server);
  } finally {
    await server.close();
  }
};

const getMutation = async (server, client, hookName) => {
  const { BudgetProvider } = await server.ssrLoadModule('/src/entities/budgets/index.ts');
  const hooks = await server.ssrLoadModule('/src/entities/debts/api/debts.query.ts');
  let mutation;
  function Probe() {
    mutation = hooks[hookName]();
    return null;
  }
  const budgetTree = createElement(BudgetProvider, { value: { scope, title: 'Семья' } }, createElement(Probe));
  renderToString(createElement(QueryClientProvider, { client }, budgetTree));
  return mutation;
};

const repaymentResult = () => {
  const base = {
    ownerType: 'group',
    ownerId: groupId,
    createdBy: userId,
    createdByActor: {
      userId, firstName: null, lastName: null, isAnonymized: true,
    },
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
    archivedAt: null,
  };
  return {
    debt: {
      ...base,
      _id: debtId,
      debtor: 'Друг',
      principalAmount: 200,
      remainingAmount: 140,
      currency: 'USD',
      status: 'active',
    },
    repayment: {
      ...base,
      _id: repaymentId,
      debtId,
      amount: 60,
      transactionDate: '2026-10-01',
      isIncome: false,
      cancelledAt: null,
      description: '',
    },
  };
};

const deferredPost = async (server) => {
  const { apiClient } = await server.ssrLoadModule('/src/shared/api/index.ts');
  const originalAdapter = apiClient.defaults.adapter;
  const sent = Promise.withResolvers();
  const response = Promise.withResolvers();
  let posts = 0;
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.method, 'post');
    posts += 1;
    sent.resolve(config);
    return {
      data: await response.promise, status: 200, statusText: 'OK', headers: {}, config,
    };
  };
  return {
    sent,
    response,
    posts: () => posts,
    restore: () => {
      apiClient.defaults.adapter = originalAdapter;
    },
  };
};

const repaymentVariables = { debtId, payload: { amount: 60, repaymentDate: '2026-10-01', isIncome: false } };

test('invalidation reaches only the captured user and budget across personal and two groups', async () => withServer(
  async (server) => {
    const { invalidateBudget, scopedKey } = await server.ssrLoadModule('/src/shared/lib/budget-api/index.ts');
    const client = createClient();
    try {
      const scopes = [userId, otherUserId].flatMap((identity) => [
        { kind: 'personal', userId: identity },
        { kind: 'group', userId: identity, groupId },
        { kind: 'group', userId: identity, groupId: otherGroupId },
      ]);
      const entries = scopes.flatMap((budget) => ['accounts', 'debts', 'reports'].map((entity) => ({
        budget, key: scopedKey(budget, [entity, 'list']),
      })));
      client.setQueryData(['users', 'me'], { _id: userId });
      client.setQueryData(['groups', 'detail', groupId], { id: groupId });
      await scopes.reduce(async (previous, target) => {
        await previous;
        entries.forEach(({ key }) => client.setQueryData(key, { value: 1 }));
        await invalidateBudget(client, target);
        entries.forEach(({ budget, key }) => {
          const expected = target.userId === userId && budget.userId === target.userId
            && budget.kind === target.kind && budget.groupId === target.groupId;
          assert.equal(client.getQueryState(key).isInvalidated, expected, JSON.stringify({ target, key }));
        });
        assert.equal(client.getQueryState(['users', 'me']).isInvalidated, false);
        assert.equal(client.getQueryState(['groups', 'detail', groupId]).isInvalidated, false);
      }, Promise.resolve());
    } finally {
      client.clear();
    }
  },
));

test('late cancellation success after logout cannot recreate cleared debt or repayment caches', async () => withServer(
  async (server) => {
    const client = createClient();
    const transport = await deferredPost(server);
    try {
      client.setQueryData(['users', 'me'], { _id: userId });
      const mutation = await getMutation(server, client, 'useCancelDebtRepaymentMutation');
      const pending = mutation.mutateAsync({ debtId, repaymentId });
      const request = await transport.sent.promise;
      assert.equal(request.url, `/groups/${groupId}/debts/${debtId}/repayments/${repaymentId}/cancel`);
      client.clear();
      const result = repaymentResult();
      result.repayment.cancelledAt = '2026-10-02';
      transport.response.resolve(result);
      await pending;
      assert.equal(transport.posts(), 1);
      assert.equal(client.getQueryCache().getAll().length, 0);
    } finally {
      transport.restore();
      client.clear();
    }
  },
));

test('late repayment success after identity switch leaves the next user cache untouched', async () => withServer(
  async (server) => {
    const client = createClient();
    const transport = await deferredPost(server);
    try {
      client.setQueryData(['users', 'me'], { _id: userId });
      const mutation = await getMutation(server, client, 'useRepayDebtMutation');
      const pending = mutation.mutateAsync(repaymentVariables);
      await transport.sent.promise;
      client.clear();
      const nextKey = ['debts', otherUserId, 'group', groupId, 'list'];
      client.setQueryData(['users', 'me'], { _id: otherUserId });
      client.setQueryData(nextKey, { items: [], total: 0 });
      transport.response.resolve(repaymentResult());
      await pending;
      assert.equal(transport.posts(), 1);
      assert.deepEqual(client.getQueryData(nextKey), { items: [], total: 0 });
      assert.equal(client.getQueryState(nextKey).isInvalidated, false);
      assert.equal(client.getQueryCache().getAll().length, 2);
    } finally {
      transport.restore();
      client.clear();
    }
  },
));

test('failed active refetch preserves successful repayment and never repeats its POST', async () => withServer(
  async (server) => {
    const client = createClient();
    const transport = await deferredPost(server);
    let unsubscribe = () => undefined;
    try {
      client.setQueryData(['users', 'me'], { _id: userId });
      const refetched = Promise.withResolvers();
      let reads = 0;
      const observer = new QueryObserver(client, {
        queryKey: ['accounts', userId, 'group', groupId, 'list'],
        initialData: [],
        staleTime: Infinity,
        queryFn: async () => {
          reads += 1;
          throw new Error('Refetch unavailable');
        },
      });
      unsubscribe = observer.subscribe((result) => {
        if (result.isError) refetched.resolve();
      });
      const mutation = await getMutation(server, client, 'useRepayDebtMutation');
      const pending = mutation.mutateAsync(repaymentVariables);
      await transport.sent.promise;
      transport.response.resolve(repaymentResult());
      const result = await pending;
      await refetched.promise;
      assert.equal(result.remainingAmount, 140);
      assert.equal(transport.posts(), 1);
      assert.equal(reads, 1);
      const executed = client.getMutationCache().getAll()[0];
      assert.equal(executed.state.status, 'success');
      assert.equal(executed.state.error, null);
      assert.equal(executed.options.retry, false);
      assert.equal(observer.getCurrentResult().isError, true);
    } finally {
      unsubscribe();
      transport.restore();
      client.clear();
    }
  },
));
