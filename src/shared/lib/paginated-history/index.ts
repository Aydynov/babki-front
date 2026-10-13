interface HistoryItem {
  _id: string;
  transactionDate: string;
}

interface HistoryPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const sortHistory = <T extends HistoryItem>(items: T[]) => (
  [...new Map(items.map((item) => [item._id, item])).values()].sort((left, right) => (
    Date.parse(right.transactionDate) - Date.parse(left.transactionDate) || right._id.localeCompare(left._id)
  ))
);

// ponytail: loads one account/month in memory; add server-side combined filtering/sorting if volume warrants it.
export const loadPaginatedHistory = async <T extends HistoryItem>(
  fetchPage: (query: { page: number; limit: number }) => Promise<HistoryPage<T>>,
) => {
  const first = await fetchPage({ page: 1, limit: 100 });
  const items = [...first.items];
  const pages = Math.ceil(first.total / first.limit);
  for (let page = 2; page <= pages; page += 1) {
    // Sequential requests avoid flooding the API for long histories.
    // eslint-disable-next-line no-await-in-loop
    const next = await fetchPage({ page, limit: 100 });
    items.push(...next.items);
  }
  return sortHistory(items);
};

export const paginateHistory = <T>(items: T[], requestedPage: number) => {
  const pages = Math.max(1, Math.ceil(items.length / 10));
  const page = Math.max(1, Math.min(requestedPage, pages));
  return {
    items: items.slice((page - 1) * 10, page * 10), page, pages, total: items.length,
  };
};
