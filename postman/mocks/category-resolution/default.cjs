// Fixtures follow the local Zod contracts; this mock only serves category-resolution checks.
const http = require('node:http');
const process = require('node:process');

let requests = [];
const categoryId = 'b'.repeat(24);
const missingId = 'e'.repeat(24);
const actor = {
  userId: 'f'.repeat(24), firstName: null, lastName: null, isAnonymized: true,
};
http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  if (path === '/reset') {
    requests = [];
    return send(200, {});
  }
  if (path === '/requests') return send(200, requests);
  requests.push(path);
  const match = path.match(/^\/spaces\/([a-f\d]{24})\/(.*)$/);
  if (!match) return send(501, { message: 'Endpoint not modeled' });
  const [, spaceId, resource] = match;
  const category = {
    _id: categoryId,
    spaceId,
    name: 'Покупки',
    isArchived: true,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };
  if (resource === 'expense-categories') {
    if (spaceId === 'c'.repeat(24)) return send(503, { message: 'List unavailable' });
    return send(200, ['d'.repeat(24), '9'.repeat(24)].includes(spaceId) ? [] : [category]);
  }
  if (resource.startsWith('expense-categories/')) {
    if (spaceId === '9'.repeat(24)) return send(404, { message: 'Category unavailable' });
    return send(200, { ...category, _id: resource.split('/')[1] });
  }
  const selectedId = spaceId === 'd'.repeat(24) ? missingId : categoryId;
  if (resource === 'expenses') {
    return send(200, {
      items: Array.from({ length: 20 }, (_, index) => ({
        _id: (index + 1).toString(16).padStart(24, '0'),
        spaceId,
        category: selectedId,
        createdBy: actor.userId,
        createdByActor: actor,
        type: 'expense',
        accountId: 'a'.repeat(24),
        amount: 10,
        currency: 'RUB',
        transactionDate: '2026-10-01',
        items: [],
      })),
      total: 20,
      page: 1,
      limit: 20,
    });
  }
  if (resource === 'expense-limits') {
    return send(200, [1, 2].map((index) => ({
      _id: index.toString(16).padStart(24, '0'),
      spaceId,
      category: selectedId,
      currency: 'RUB',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      total: 1000,
      rest: 800,
    })));
  }
  return send(501, { message: 'Endpoint not modeled' });
}).listen(process.env.PORT);
