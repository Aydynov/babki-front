import type { Expense, ExpensesPaginatedResponse } from './schemas';

export const replaceExpenseInPaginatedResponse = (
  expenses: ExpensesPaginatedResponse,
  updatedExpense: Expense,
): ExpensesPaginatedResponse => {
  if (!expenses.items.some(({ _id }) => _id === updatedExpense._id)) return expenses;

  return {
    ...expenses,
    items: expenses.items.map((expense) => (expense._id === updatedExpense._id ? updatedExpense : expense)),
  };
};
