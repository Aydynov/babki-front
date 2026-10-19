interface LedgerAccount { _id: string; currency: string; initialAmount: number; openedAt: string }
interface LedgerRow {
  _id: string;
  transactionDate: string;
  type: 'income' | 'expense' | 'transfer';
  amount?: number;
  source?: { accountId: string; amount: number };
  destination?: { accountId: string; amount: number };
}
export const calculateHistoricalBalance = (account: LedgerAccount, rows: LedgerRow[], endDate: string) => {
  const end = Date.parse(`${endDate.slice(0, 10)}T23:59:59.999Z`);
  if (Date.parse(account.openedAt) > end) return 0;
  const units = new Intl.NumberFormat('en', { style: 'currency', currency: account.currency })
    .resolvedOptions().maximumFractionDigits ?? 2;
  const factor = 10 ** units;
  let amount = Math.round(account.initialAmount * factor);
  rows.forEach((row) => {
    if (Date.parse(row.transactionDate) > end) return;
    if (row.type === 'transfer') {
      if (row.source?.accountId === account._id) amount -= Math.round(row.source.amount * factor);
      if (row.destination?.accountId === account._id) amount += Math.round(row.destination.amount * factor);
    } else {
      amount += Math.round((row.amount ?? 0) * factor) * (row.type === 'income' ? 1 : -1);
    }
  });
  return amount / factor;
};

export const loadCompleteLedger = async <T extends { _id: string }>(
  fetchPage: (pagination: { page: number; limit: number }) => Promise<{
    items: T[]; page: number; total: number; limit: number;
  }>,
) => {
  const first = await fetchPage({ page: 1, limit: 100 });
  const items = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.limit); page += 1) {
    // Sequential pagination preserves server order without flooding the API.
    // eslint-disable-next-line no-await-in-loop
    const next = await fetchPage({ page, limit: first.limit });
    if (next.total !== first.total || next.page !== page) throw new Error('История изменилась. Обновите данные.');
    items.push(...next.items);
  }
  if (items.length !== first.total || new Set(items.map(({ _id }) => _id)).size !== first.total) {
    throw new Error('История неполна. Обновите данные.');
  }
  return items;
};
