import type {
  CategorySelectOption,
} from '@/entities/expense-categories';
import { z } from 'zod';
import { currencyCodeSchema } from '@/shared/lib/currency';
import {
  hasValidMoneyFormat,
  parseExpenseLimitTotal,
} from './limit-draft';

export type ExpenseLimitDraftFieldError = 'required' | 'invalid' | 'min' | 'precision' | 'duplicate';

export interface ExpenseLimitDraftErrors {
  categoryId?: ExpenseLimitDraftFieldError;
  total?: ExpenseLimitDraftFieldError;
}

const expenseLimitTotalSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .refine((value) => parseExpenseLimitTotal(value) !== undefined, 'invalid')
  .refine((value) => (parseExpenseLimitTotal(value) ?? 0) >= 0.01, 'min');

export const expenseLimitDraftValuesSchema = z.object({
  categoryId: z.string().trim().min(1, 'required'),
  currency: currencyCodeSchema,
  total: expenseLimitTotalSchema,
}).superRefine(({ currency, total }, context) => {
  if (!hasValidMoneyFormat(total, currency)) {
    context.addIssue({ code: 'custom', message: 'precision', path: ['total'] });
  }
});

export const expenseLimitFormSchema = z.object({
  drafts: z.array(z.object({
    key: z.string(),
    limitId: z.string().optional(),
    writeConfirmed: z.boolean().optional(),
    category: z.custom<CategorySelectOption>().optional(),
    baselineTotal: z.number().nullable(),
    values: expenseLimitDraftValuesSchema,
  })).superRefine((drafts, context) => {
    drafts.forEach((draft, index) => {
      if (draft.limitId || !draft.values.categoryId) return;

      const duplicate = drafts.some((other, otherIndex) => (
        otherIndex !== index
        && other.values.categoryId === draft.values.categoryId
        && other.values.currency === draft.values.currency
      ));

      if (duplicate) {
        context.addIssue({
          code: 'custom',
          message: 'duplicate',
          path: [index, 'values', 'categoryId'],
        });
      }
    });
  }),
});
