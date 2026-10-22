/* global pm, process */
// Local-only synthetic scenario derived from babki-back space DTOs and OpenAPI (2026-10-22).
// It verifies frontend HTTP behavior, not backend accounting or authorization correctness.
const http = require('node:http');

const identity = '000000000000000000000001';
const actor = {
  userId: identity,
  firstName: 'Анна',
  lastName: 'Тестовая',
  isAnonymized: false,
};
const permissions = {
  manageAccounts: true,
  manageCategories: true,
  manageLimits: true,
  manageTransactions: true,
};
const stamp = '2026-10-22T09:00:00.000Z';
const seed = () => ({
  next: 10,
  spaces: [],
  records: {},
  requests: [],
  flags: {},
});
const id = (state) => {
  const { next } = state;
  // eslint-disable-next-line no-param-reassign -- The disposable fixture owns its state.
  state.next += 1;
  return String(next).padStart(24, '0');
};
const meta = (state, spaceId) => ({
  _id: id(state),
  spaceId,
  createdBy: identity,
  createdByActor: actor,
  createdAt: stamp,
  updatedAt: stamp,
});
const page = (items, query) => {
  const current = Number(query.get('page') || 1);
  const limit = Number(query.get('limit') || 20);
  return {
    items: items.slice((current - 1) * limit, current * limit),
    total: items.length,
    page: current,
    limit,
  };
};
const list = (state, spaceId, name) => {
  // eslint-disable-next-line no-param-reassign -- Initialize the disposable fixture state.
  state.records[spaceId] ||= {};
  // eslint-disable-next-line no-param-reassign -- Initialize the disposable fixture state.
  state.records[spaceId][name] ||= [];
  return state.records[spaceId][name];
};
const filterOperations = (items, q) => items
  .filter(
    (row) => (!q.get('accountId')
          || row.accountId === q.get('accountId')
          || row.source?.accountId === q.get('accountId')
          || row.destination?.accountId === q.get('accountId'))
        && (!q.get('currency') || row.currency === q.get('currency'))
        && (!q.get('participantId') || row.participantId === q.get('participantId'))
        && (!q.get('transactionType') || row.type === q.get('transactionType'))
        && (!q.get('fromDate') || Date.parse(row.transactionDate) >= Date.parse(q.get('fromDate')))
        && (!q.get('toDate') || Date.parse(row.transactionDate) <= Date.parse(q.get('toDate'))),
  )
  .sort(
    (a, b) => Date.parse(b.transactionDate) - Date.parse(a.transactionDate) || b._id.localeCompare(a._id),
  );
const applyMoney = (state, spaceId, row, sign = 1) => {
  const accounts = list(state, spaceId, 'accounts');
  if (row.type === 'transfer') {
    accounts.find((a) => a._id === row.source.accountId).amount -= sign * row.source.amount;
    accounts.find((a) => a._id === row.destination.accountId).amount += sign * row.destination.amount;
  } else {
    accounts.find((a) => a._id === row.accountId).amount
      += sign * row.amount * (row.type === 'income' ? 1 : -1);
  }
};
http
  .createServer(async (req, res) => {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    };
    const state = (await pm.state.get('babki.space-finance')) || seed();
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const q = url.searchParams;
    const body = req.body || {};
    const send = async (data, status = 200, extra = {}) => {
      await pm.state.set('babki.space-finance', state);
      res.writeHead(status, { ...headers, ...extra });
      res.end(status === 204 ? undefined : JSON.stringify(data));
    };
    const fail = (status, message) => send(
      {
        statusCode: status,
        message,
        error: 'Request failed',
        path,
        timestamp: stamp,
      },
      status,
    );
    if (req.method === 'OPTIONS') return send({});
    if (path === '/__test/reset') {
      Object.assign(state, seed());
      return send({});
    }
    if (path === '/__test/state') return send(state);
    if (path === '/__test/config') {
      Object.assign(state.flags, body);
      return send({});
    }
    state.requests.push({
      method: req.method,
      path,
      query: Object.fromEntries(q),
      body,
    });
    if (state.flags.failure && path.includes(state.flags.failure.match)) {
      const { failure } = state.flags;
      return fail(failure.status, failure.message || 'Synthetic service failure');
    }
    const user = {
      _id: identity,
      firstName: actor.firstName,
      lastName: actor.lastName,
      email: 'anna@example.test',
    };
    if (path === '/users/me') return req.method === 'DELETE' ? send({}, 202) : send(user);
    if (path === '/auth/two-factor') return send({ status: 'disabled', recoveryCodesRemaining: 0 });
    if (['/auth/login', '/auth/register'].includes(path)) {
      if (Object.hasOwn(body, 'currency')) return fail(400, ['property currency should not exist']);
      return send(
        { accessToken: 'synthetic-space-fixture', user },
        path.endsWith('register') ? 201 : 200,
      );
    }
    if (path === '/spaces' && req.method === 'GET') return send(page(state.spaces, q));
    if (path === '/spaces' && req.method === 'POST') {
      if (!body.name || Object.keys(body).some((key) => !['name', 'description'].includes(key))) {
        return fail(400, 'Invalid space');
      }
      const row = {
        id: id(state),
        name: body.name.trim(),
        description: body.description,
        ownerId: identity,
        role: 'owner',
        permissions: { ...permissions },
        createdAt: stamp,
        updatedAt: stamp,
      };
      state.spaces.push(row);
      return send(row, 201);
    }
    if (path === '/space-invitations/preview') {
      if (state.flags.invitationError) return fail(state.flags.invitationError, 'Invalid invitation');
      return send({ name: 'Приглашённое пространство', expiresAt: '2026-10-29T09:00:00.000Z' });
    }
    if (path === '/space-invitations/accept') {
      if (state.flags.invitationError) return fail(state.flags.invitationError, 'Invalid invitation');
      const space = {
        id: id(state),
        name: 'Приглашённое пространство',
        ownerId: '000000000000000000000002',
        role: 'member',
        permissions: Object.fromEntries(Object.keys(permissions).map((key) => [key, false])),
        createdAt: stamp,
        updatedAt: stamp,
      };
      state.spaces.push(space);
      return send({ spaceId: space.id, role: 'member' });
    }
    const match = path.match(/^\/spaces\/([a-f\d]{24})(?:\/(.*))?$/);
    if (!match) return fail(501, 'Scenario does not model this endpoint');
    const [, spaceId, rest = ''] = match;
    const space = state.spaces.find((s) => s.id === spaceId);
    if (!space) return fail(404, 'Space not found');
    if (!rest) {
      if (state.flags.spaceDenied) return fail(404, 'Space not found');
      if (req.method === 'PATCH') Object.assign(space, body);
      if (req.method === 'DELETE') {
        state.spaces = state.spaces.filter((s) => s.id !== spaceId);
        return send(null, 204);
      }
      return send({
        ...space,
        ...(state.flags.spaceRole ? { role: state.flags.spaceRole } : {}),
        ...(state.flags.spacePermissions ? { permissions: state.flags.spacePermissions } : {}),
      });
    }
    if (rest === 'leave') {
      state.spaces = state.spaces.filter((s) => s.id !== spaceId);
      return send(null, 204);
    }
    if (rest === 'members') {
      return send(
        page(
          [
            {
              ...actor,
              role: 'owner',
              joinedAt: stamp,
              permissions,
            },
          ],
          q,
        ),
      );
    }
    if (rest.startsWith('members/')) {
      return req.method === 'DELETE' ? send(null, 204) : send({ ...permissions, ...body });
    }
    if (rest === 'ownership') {
      space.ownerId = body.userId;
      space.role = 'member';
      space.permissions = {
        ...permissions,
        manageAccounts: false,
        manageCategories: false,
        manageLimits: false,
        manageTransactions: false,
      };
      return send(space);
    }
    if (rest === 'invitations') {
      return req.method === 'GET'
        ? send(page([], q))
        : send({ id: id(state), token: 'a'.repeat(43), expiresAt: '2026-10-29T09:00:00.000Z' }, 201);
    }
    if (rest.startsWith('invitations/')) return send(null, 204);
    if (rest.startsWith('reports/')) {
      const yearly = rest.endsWith('years');
      const from = new Date(q.get('fromDate') || '2026-01-01');
      const to = new Date(q.get('toDate') || '2026-12-31');
      const reports = [];
      for (
        let date = new Date(Date.UTC(from.getUTCFullYear(), yearly ? 0 : from.getUTCMonth(), 1));
        date <= to;
        date.setUTCMonth(date.getUTCMonth() + (yearly ? 12 : 1))
      ) {
        const period = date.toISOString().slice(0, yearly ? 4 : 7);
        const accounts = list(state, spaceId, 'accounts').filter(
          (a) => a.openedAt.slice(0, yearly ? 4 : 7) <= period,
        );
        const currencies = [...new Set(accounts.map((a) => a.currency))].sort().map((currency) => {
          const rows = list(state, spaceId, 'transactions').filter(
            (r) => r.currency === currency && r.transactionDate.startsWith(period),
          );
          const incomes = rows.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
          const expenses = rows
            .filter((r) => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);
          const totals = (type) => accounts
            .filter((a) => a.currency === currency && a.type === type)
            .reduce((sum, a) => sum + a.amount, 0);
          const transfers = list(state, spaceId, 'transfers').filter((r) => r.transactionDate.startsWith(period));
          const transferTotal = (side) => transfers
            .filter((r) => r[side].currency === currency)
            .reduce((sum, r) => sum + r[side].amount, 0);
          return {
            currency,
            incomes,
            expenses,
            transfersIn: transferTotal('destination'),
            transfersOut: transferTotal('source'),
            balance: totals('balance'),
            saving: totals('saving'),
            expensesByCategory: list(state, spaceId, 'expense-categories').map((c) => ({
              categoryId: c._id,
              total: rows
                .filter((r) => r.type === 'expense' && r.category === c._id)
                .reduce((sum, r) => sum + r.amount, 0),
            })),
          };
        });
        reports.push({ period, currencies });
      }
      return send(reports);
    }
    if (rest === 'expenses/revenue') {
      const rows = filterOperations(
        list(state, spaceId, 'transactions').filter((r) => r.type === 'expense'),
        q,
      );
      const currencies = [...new Set(rows.map((r) => r.currency))].map((currency) => ({
        currency,
        totalRevenue: rows.filter((r) => r.currency === currency).reduce((sum, r) => sum + r.amount, 0),
      }));
      return send({
        currencies,
        totalRevenue: currencies.length > 1 ? null : currencies[0]?.totalRevenue || 0,
      });
    }
    const [collection, recordId, action, repaymentId, cancel] = rest.split('/');
    const items = list(state, spaceId, collection);
    const record = items.find((r) => r._id === recordId);
    if (collection === 'transactions') {
      return recordId ? fail(501, 'Typed details required') : send(page(filterOperations(items, q), q));
    }
    if (recordId && !record) return fail(404, 'Record not found');
    if (action === 'archive') {
      record.archivedAt = stamp;
      return send(null, 204);
    }
    if (action === 'close' && collection === 'plans') {
      if (record.status === 'closed') return fail(400, 'Already executed');
      record.status = 'closed';
      record.closedAt = stamp;
      record.expenseId = id(state);
      const expense = {
        ...meta(state, spaceId),
        _id: record.expenseId,
        type: 'expense',
        accountId: body.accountId,
        category: record.categoryId,
        currency: record.currency,
        amount: body.amount || record.amount,
        transactionDate: body.closingDate || stamp,
        description: body.description || record.description,
        participantId: body.participantId || identity,
        participantActor: actor,
        items: [],
        origin: { type: 'plan', id: record._id },
      };
      list(state, spaceId, 'expenses').push(expense);
      list(state, spaceId, 'transactions').push(expense);
      applyMoney(state, spaceId, expense);
      return send(record);
    }
    if (action === 'repayments' && collection === 'debts') {
      const repayments = list(state, spaceId, `repayments-${recordId}`);
      const repayment = repayments.find((r) => r._id === repaymentId);
      if (cancel === 'cancel') {
        if (!repayment || repayment.cancelledAt) return fail(409, 'Already cancelled');
        repayment.cancelledAt = stamp;
        repayment.cancelledBy = identity;
        repayment.cancelledByActor = actor;
        record.remainingAmount += repayment.amount;
        record.status = 'active';
        if (repayment.incomeId) {
          const incomes = list(state, spaceId, 'incomes');
          const income = incomes.find((r) => r._id === repayment.incomeId);
          applyMoney(state, spaceId, income, -1);

          state.records[spaceId].incomes = incomes.filter((r) => r !== income);

          state.records[spaceId].transactions = list(state, spaceId, 'transactions').filter(
            (r) => r !== income,
          );
        }
        return send({ debt: record, repayment });
      }
      if (req.method === 'GET') return repaymentId ? send(repayment) : send(page(repayments, q));
      if (
        typeof body.isIncome !== 'boolean'
        || (body.isIncome && !body.accountId)
        || (!body.isIncome && body.accountId)
      ) return fail(400, 'Invalid repayment');
      const row = {
        ...meta(state, spaceId),
        debtId: recordId,
        amount: body.amount,
        isIncome: body.isIncome,
        transactionDate: body.repaymentDate,
        description: body.description,
        cancelledAt: null,
      };
      repayments.push(row);
      record.remainingAmount -= body.amount;
      record.status = record.remainingAmount ? 'active' : 'closed';
      if (body.isIncome) {
        const income = {
          ...meta(state, spaceId),
          accountId: body.accountId,
          type: 'income',
          currency: record.currency,
          amount: body.amount,
          transactionDate: body.repaymentDate,
          origin: { type: 'debt', id: recordId },
        };
        row.incomeId = income._id;
        list(state, spaceId, 'incomes').push(income);
        list(state, spaceId, 'transactions').push(income);
        applyMoney(state, spaceId, income);
      }
      return send({ debt: record, repayment: row }, 201);
    }
    if (req.method === 'GET') {
      if (recordId) return send(record);
      let rows = ['incomes', 'expenses', 'transfers'].includes(collection)
        ? filterOperations(items, q)
        : items;
      if (['plans', 'debts'].includes(collection)) {
        rows = rows.filter((r) => q.get('includeArchived') === 'true' || !r.archivedAt);
      }
      if (['accounts', 'expense-categories', 'expense-limits'].includes(collection)) return send(rows);
      return send(page(rows, q));
    }
    if (req.method === 'DELETE') {
      if (record.origin?.type === 'debt') return fail(409, 'Cancel the repayment');
      if (['income', 'expense', 'transfer'].includes(record.type)) applyMoney(state, spaceId, record, -1);

      state.records[spaceId][collection] = items.filter((r) => r !== record);

      state.records[spaceId].transactions = list(state, spaceId, 'transactions').filter(
        (r) => r._id !== recordId,
      );
      return send(null, 204);
    }
    if (req.method === 'PATCH') {
      if (record.origin?.type === 'debt') return fail(409, 'Cancel the repayment');
      Object.assign(record, body);
      return send(record);
    }
    const row = { ...meta(state, spaceId), ...body };
    if (collection === 'accounts') {
      Object.assign(row, {
        amount: body.amount || 0,
        initialAmount: body.amount || 0,
        openedAt: body.openedAt || stamp,
        type: body.type || 'balance',
        archivedAt: null,
        timeline: [],
      });
    } else if (collection === 'expense-categories') row.isArchived = false;
    else if (collection === 'plans') Object.assign(row, { status: 'active', archivedAt: null });
    else if (collection === 'debts') {
      Object.assign(row, { status: 'active', archivedAt: null, remainingAmount: body.principalAmount });
    } else if (['incomes', 'expenses'].includes(collection)) {
      const account = list(state, spaceId, 'accounts').find((a) => a._id === body.accountId);
      if (!account) return fail(404, 'Account not found');
      if (account.archivedAt) return fail(404, 'Archived account');
      Object.assign(row, {
        type: collection === 'incomes' ? 'income' : 'expense',
        currency: account.currency,
        origin: null,
      });
      if (collection === 'expenses') {
        Object.assign(row, {
          category: body.categoryId,
          participantId: body.participantId || identity,
          participantActor: actor,
          items: body.items || [],
        });
      }
      list(state, spaceId, 'transactions').push(row);
      applyMoney(state, spaceId, row);
    } else if (collection === 'transfers') {
      const accounts = list(state, spaceId, 'accounts');
      const source = accounts.find((a) => a._id === body.sourceAccountId);
      const destination = accounts.find((a) => a._id === body.destinationAccountId);
      if (!source || !destination) return fail(404, 'Account not found');
      Object.assign(row, {
        type: 'transfer',
        source: { accountId: source._id, amount: body.sourceAmount, currency: source.currency },
        destination: {
          accountId: destination._id,
          amount: body.destinationAmount,
          currency: destination.currency,
        },
        effectiveRate: {
          baseCurrency: source.currency,
          quoteCurrency: destination.currency,
          rate: body.destinationAmount / body.sourceAmount,
        },
      });
      list(state, spaceId, 'transactions').push(row);
      applyMoney(state, spaceId, row);
    } else return fail(501, 'Scenario does not model this mutation');
    items.push(row);
    return send(row, 201);
  })
  .listen(process.env.PORT);
