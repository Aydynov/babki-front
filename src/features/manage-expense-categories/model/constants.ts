export const CATEGORY_COLORS = [
  { value: '#C94F4F', nameKey: 'expenseCategories.colors.darkRed' },
  { value: '#E05D5D', nameKey: 'expenseCategories.colors.red' },
  { value: '#D85B77', nameKey: 'expenseCategories.colors.rose' },
  { value: '#C05A9D', nameKey: 'expenseCategories.colors.magenta' },
  { value: '#A45DB5', nameKey: 'expenseCategories.colors.plum' },
  { value: '#8B5FC5', nameKey: 'expenseCategories.colors.violet' },
  { value: '#6667C8', nameKey: 'expenseCategories.colors.indigo' },
  { value: '#4F7FCF', nameKey: 'expenseCategories.colors.blue' },
  { value: '#3D94B8', nameKey: 'expenseCategories.colors.sky' },
  { value: '#2D9C95', nameKey: 'expenseCategories.colors.teal' },
  { value: '#3E9B68', nameKey: 'expenseCategories.colors.green' },
  { value: '#62A64A', nameKey: 'expenseCategories.colors.lightGreen' },
  { value: '#82A93E', nameKey: 'expenseCategories.colors.lime' },
  { value: '#A9B63D', nameKey: 'expenseCategories.colors.yellowGreen' },
  { value: '#D9A321', nameKey: 'expenseCategories.colors.ochre' },
  { value: '#E7B43A', nameKey: 'expenseCategories.colors.yellow' },
  { value: '#E58B3C', nameKey: 'expenseCategories.colors.orange' },
  { value: '#D9763E', nameKey: 'expenseCategories.colors.darkOrange' },
  { value: '#B86A4B', nameKey: 'expenseCategories.colors.terracotta' },
  { value: '#9A7358', nameKey: 'expenseCategories.colors.brown' },
  { value: '#836F63', nameKey: 'expenseCategories.colors.taupe' },
  { value: '#66747F', nameKey: 'expenseCategories.colors.slate' },
  { value: '#738A91', nameKey: 'expenseCategories.colors.blueGray' },
  { value: '#6D8D7B', nameKey: 'expenseCategories.colors.sage' },
  { value: '#8B8074', nameKey: 'expenseCategories.colors.warmGray' },
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number]['value'];

export const CATEGORY_COLOR_VALUES = CATEGORY_COLORS.map(({ value }) => value);

export const isCategoryColor = (value: string): value is CategoryColor => (
  CATEGORY_COLOR_VALUES.some((color) => color === value)
);
