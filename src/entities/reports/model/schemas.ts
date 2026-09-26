import { z } from 'zod';
import {
  dateStringSchema,
  objectIdSchema,
} from '@/shared/api';
import {
  currencyCodeSchema,
  sortCurrencyCodes,
  type CurrencyCode,
} from '@/shared/lib/currency';

export const reportCurrencySchema = z.object({
  currency: currencyCodeSchema,
  expenses: z.number(),
  incomes: z.number(),
  transfersIn: z.number(),
  transfersOut: z.number(),
  saving: z.number(),
  balance: z.number(),
  expensesByCategory: z.array(z.object({
    categoryId: objectIdSchema,
    total: z.number(),
  })),
});

export const reportPeriodSchema = z.object({
  period: dateStringSchema,
  currencies: z.array(reportCurrencySchema),
});

export const sortReportCurrencies = <T extends { currency: CurrencyCode }>(
  currencies: T[],
  defaultCurrency: CurrencyCode,
) => {
  const order = sortCurrencyCodes(currencies.map(({ currency }) => currency), defaultCurrency);
  return [...currencies].sort((left, right) => (
    order.indexOf(left.currency) - order.indexOf(right.currency)
  ));
};

export const findMonthlyReportsByQuerySchema = z.object({
  fromDate: dateStringSchema.optional(),
  toDate: dateStringSchema.optional(),
  categories: z.array(objectIdSchema).optional(),
});

export const findYearlyReportsByQuerySchema = z.object({
  categories: z.array(objectIdSchema).optional(),
});

export type ReportCurrency = z.infer<typeof reportCurrencySchema>;
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type FindMonthlyReportsByQuery = z.infer<typeof findMonthlyReportsByQuerySchema>;
export type FindYearlyReportsByQuery = z.infer<typeof findYearlyReportsByQuerySchema>;
