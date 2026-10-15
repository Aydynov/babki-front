/* global pm, process */
// Local-only synthetic fixtures based on the frontend Zod contracts. No real user data.
const http = require('node:http');

const id = (n) => String(n).padStart(24, '0');
const account = (n, name, currency, type = 'balance', archivedAt = null) => ({
  _id: id(n),
  name,
  currency,
  type,
  archivedAt,
  amount: 12345,
  initialAmount: 0,
  openedAt: '2026-01-01',
  timeline: [],
});
const seed = () => {
  const accounts = [
    account(1, 'Основной расчётный', 'RUB'), account(2, 'Долларовый расчётный', 'USD'),
    account(3, 'Накопительный USD', 'USD', 'saving'),
    account(4, 'Архивный USD', 'USD', 'balance', '2026-10-01'),
    account(5, 'Евро расчётный', 'EUR'),
  ];
  const incomes = ['2026-10', '2026-09'].flatMap((month, m) => ['USD', 'RUB'].flatMap((currency, c) => (
    Array.from({ length: c === 0 ? 112 : 8 }, (_, i) => ({
      _id: id(1000 + m * 1000 + c * 200 + i),
      snapshotId: id(99),
      accountId: c === 1 ? id(1) : [id(2), id(3), id(4), id(999)][i % 4],
      currency,
      type: 'income',
      amount: i + 1,
      source: i === 110 ? '' : `${month} ${currency} Доход ${i + 1} с длинным источником`,
      transactionDate: `${month}-${String(1 + (Math.floor(i / 4) % 28)).padStart(2, '0')}`,
    }))
  )));
  const transfers = Array.from({ length: 11 }, (_, i) => ({
    _id: id(5000 + i),
    type: 'transfer',
    source: {
      accountId: id(1), snapshotId: id(98), currency: 'RUB', amount: 100,
    },
    destination: {
      accountId: id(2), snapshotId: id(99), currency: 'USD', amount: 1,
    },
    transactionDate: '2026-10-10',
    effectiveRate: { baseCurrency: 'RUB', quoteCurrency: 'USD', rate: 0.01 },
  }));
  return {
    accounts, incomes, transfers, flags: {}, requests: [], mutations: [],
  };
};
http.createServer(async (req, res) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  };
  const send = (data, status = 200) => {
    res.writeHead(status, headers);
    res.end(JSON.stringify(data));
  };
  if (req.method === 'OPTIONS') return send({});
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const state = await pm.state.get('babki.monthly-incomes') || seed();
  const body = req.body || {};
  if (p === '/__test/reset') {
    await pm.state.set('babki.monthly-incomes', seed());
    return send({});
  }
  if (p === '/__test/state') return send(state);
  if (p === '/__test/config') {
    Object.assign(state.flags, body.flags || {});
    if (body.accounts) state.accounts = body.accounts;
    if (body.incomes) state.incomes = body.incomes;
    await pm.state.set('babki.monthly-incomes', state);
    return send({});
  }
  state.requests.push({ path: p, method: req.method, query: Object.fromEntries(url.searchParams) });
  await pm.state.set('babki.monthly-incomes', state);
  if (state.flags.delay && (p === '/incomes' || p === '/incomes/revenue')) {
    await new Promise((resolve) => {
      setTimeout(resolve, state.flags.delay);
    });
  }
  if (state.flags.fail === p
    && (!state.flags.failMonth || url.searchParams.get('fromDate')?.startsWith(state.flags.failMonth))) {
    return send({ message: 'Synthetic failure' }, 500);
  }
  if (p === '/users/me') {
    return send({
      _id: id(10),
      firstName: 'Тест',
      lastName: 'Проверка',
      email: 'test@example.com',
      defaultCurrency: 'RUB',
      defaultAccountId: id(1),
    });
  }
  if (p === '/accounts' && req.method === 'POST') {
    const created = {
      ...account(state.accounts.length + 20, body.name, body.currency, body.type),
      initialAmount: body.amount || 0,
      amount: body.amount || 0,
      openedAt: body.openedAt || '2026-10-15',
    };
    state.accounts.push(created);
    state.mutations.push({ path: p, body });
    await pm.state.set('babki.monthly-incomes', state);
    return send(created, 201);
  }
  if (p === '/accounts') return send(state.accounts);
  if (p === '/incomes' && req.method === 'POST') {
    const a = state.accounts.find((item) => item._id === body.accountId);
    if (!a || a.archivedAt || a.type !== 'balance') return send({ message: 'Ineligible account' }, 400);
    const created = {
      ...body, _id: id(9000 + state.mutations.length), snapshotId: id(99), type: 'income', currency: a.currency,
    };
    state.incomes.push(created);
    state.mutations.push({ path: p, body });
    await pm.state.set('babki.monthly-incomes', state);
    return send(created, 201);
  }
  const query = Object.fromEntries(url.searchParams);
  const rows = state.incomes.filter((row) => (!query.fromDate || row.transactionDate >= query.fromDate)
    && (!query.toDate || row.transactionDate <= query.toDate)
    && (!query.currency || row.currency === query.currency)
    && (!query.accountId || row.accountId === query.accountId)
    && (!query.transactionType || query.transactionType === 'income'));
  if (p === '/incomes/revenue') {
    return send({
      totalRevenue: null,
      currencies: [...new Set(rows.map((row) => row.currency))].map((currency) => ({
        currency, totalRevenue: rows.filter((r) => r.currency === currency).reduce((sum, r) => sum + r.amount, 0),
      })),
    });
  }
  if (p === '/incomes' || p === '/transactions' || p === '/transfers') {
    const selected = p === '/transfers' ? state.transfers : rows;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return send({
      items: selected.slice((page - 1) * limit, page * limit), total: selected.length, page, limit,
    });
  }
  // Existing dashboard read-only collections not under test use successful empty fixtures.
  if (p.endsWith('revenue')) return send({ totalRevenue: null, currencies: [] });
  if (p.includes('snapshot')) return send(null);
  if (['/expenses', '/debts', '/plans', '/expense-categories', '/expense-limits', '/reports/monthly',
    '/reports/yearly', '/reports/years', '/reports/months',
    '/categories', '/expenses/categories', '/limits'].includes(p)) return send([]);
  return send({ message: 'Endpoint outside this simulation' }, 501);
}).listen(process.env.PORT || 4906);
