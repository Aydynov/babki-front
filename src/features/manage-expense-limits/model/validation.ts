import type {
  CategorySelectOption,
} from '@/entities/expense-categories';
import { z } from 'zod';
import { currencyCodeSchema } from '@/shared/lib/currency';
import {
  hasValidMoneyFormat,
} from './limit-draft';

export type ExpenseLimitDraftFieldError = 'required' | 'invalid' | 'min' | 'precision' | 'duplicate';

export interface ExpenseLimitDraftErrors {
  categoryId?: ExpenseLimitDraftFieldError;
  total?: ExpenseLimitDraftFieldError;
}

export const getExpenseLimitDraftValuesSchema = () => z.object({
  categoryId: z.string().trim().min(1, 'required'),
  currency: currencyCodeSchema,
  total: z.string().trim().min(1, 'required')
    .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, 'min'),
}).superRefine(({ currency, total }, context) => {
  if (!hasValidMoneyFormat(total, currency)) {
    context.addIssue({ code: 'custom', message: 'precision', path: ['total'] });
  }
});

export const expenseLimitDraftValuesSchema = getExpenseLimitDraftValuesSchema();

export const getExpenseLimitFormSchema = () => z.object({
  drafts: z.array(z.object({
    key: z.string(),
    limitId: z.string().optional(),
    writeConfirmed: z.boolean().optional(),
    category: z.custom<CategorySelectOption>().optional(),
    baselineTotal: z.number().nullable(),
    values: getExpenseLimitDraftValuesSchema(),
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

export const expenseLimitFormSchema = getExpenseLimitFormSchema();
