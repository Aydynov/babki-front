import { z } from 'zod';
// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { currencyCodeSchema, hasValidMoneyPrecision, type CurrencyCode } from '../../../shared/lib/currency/index.ts';

export const createPlanFormSchema = z.object({
  currency: currencyCodeSchema,
  description: z
    .string()
    .trim()
    .min(1, 'required')
    .max(500, 'descriptionTooLong'),
  categoryId: z.string().trim().min(1, 'required'),
  amount: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => !Number.isNaN(Number(value)), 'invalid')
    .refine((value) => Number(value) >= 0.01, 'min'),
  targetDate: z.string().trim().min(1, 'required'),
});

export type CreatePlanFormValues = z.infer<typeof createPlanFormSchema>;

export const defaultCreatePlanFormValues: CreatePlanFormValues = {
  currency: 'RUB',
  description: '',
  categoryId: '',
  amount: '',
  targetDate: '',
};

export const hasValidPlanAmountPrecision = (amount: string, currency: CurrencyCode) => (
  hasValidMoneyPrecision(Number(amount), currency)
);
