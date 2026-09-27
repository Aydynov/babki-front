interface Category {
  _id: string;
}

interface CategoryTotal {
  categoryId: string;
  total: number;
}

export const getSortedMonthlyExpenseCategoryRows = <T extends Category>(
  categories: readonly T[] | null | undefined,
  bucket: { expensesByCategory: readonly CategoryTotal[] } | undefined,
) => {
  const totals = new Map(bucket?.expensesByCategory.map(({ categoryId, total }) => [categoryId, total]));

  return (categories ?? [])
    .map((category, index) => ({
      category,
      total: totals.get(category._id) ?? 0,
      index,
    }))
    .sort((left, right) => right.total - left.total || left.index - right.index)
    .map(({ category, total }) => ({ category, total }));
};
