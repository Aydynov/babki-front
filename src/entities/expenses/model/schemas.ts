import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionSchema,
  transactionsRevenueSchema,
} from '@/entities/transactions/@x/expenses';
import { z } from 'zod';
import {
  entityMetaSchema,
  objectIdSchema,
  paginatedResponseSchema,
} from '@/shared/api';
import { expenseCategorySchema } from '@/entities/expense-categories/@x/expenses';

export const expenseItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export const expenseSchema = z
  .object({
    category: expenseCategorySchema,
    merchant: z.string().max(255).optional(),
    items: expenseItemSchema.array(),
  })
  .extend(transactionSchema.shape)
  .extend(entityMetaSchema.shape);

export const createExpenseSchema = z.object({
  categoryId: objectIdSchema,
  merchant: z.string().max(255).optional(),
  items: expenseItemSchema.array().optional(),
}).extend(createTransactionSchema.shape);

export const updateExpenseSchema = createExpenseSchema
  .omit({ accountId: true, transactionDate: true })
  .partial();

export const listExpensesQuerySchema = z.object({
  categoryId: objectIdSchema.optional(),
}).extend(listTransactionsQuerySchema.shape);

export const expensesPaginatedResponseSchema = paginatedResponseSchema(expenseSchema);
export const expenseRevenueSchema = transactionsRevenueSchema;

export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExpensesPaginatedResponse = z.infer<typeof expensesPaginatedResponseSchema>;
export type ExpenseRevenue = z.infer<typeof expenseRevenueSchema>;
