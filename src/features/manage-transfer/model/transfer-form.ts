import type { CreateTransferDto, UpdateTransferDto } from '@/entities/transfers';
import { z } from 'zod';
// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { hasValidMoneyPrecision, type CurrencyCode } from '../../../shared/lib/currency/index.ts';

interface TransferAccount {
  _id: string;
  amount: number;
  currency: CurrencyCode;
  archivedAt: string | null;
}

const positiveAmountSchema = z.string()
  .trim()
  .min(1, 'required')
  .refine((value) => Number.isFinite(Number(value)), 'invalid')
  .refine((value) => Number(value) > 0, 'positive');

export const transferFormSchema = z.object({
  sourceAccountId: z.string().trim().min(1, 'required'),
  destinationAccountId: z.string().trim().min(1, 'required'),
  sourceAmount: positiveAmountSchema,
  destinationAmount: positiveAmountSchema,
  transactionDate: z.string().trim().min(1, 'required').pipe(z.iso.date('dateInvalid')),
  description: z.string().max(1000, 'tooLong'),
}).refine(
  ({ sourceAccountId, destinationAccountId }) => sourceAccountId !== destinationAccountId,
  { message: 'accountsDistinct', path: ['destinationAccountId'] },
);

export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const getDefaultTransferFormValues = (
  sourceAccountId = '',
): TransferFormValues => ({
  sourceAccountId,
  destinationAccountId: '',
  sourceAmount: '',
  destinationAmount: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
});

export const getEligibleTransferDestinations = <T extends TransferAccount>(
  accounts: T[],
  sourceAccountId: string,
) => accounts.filter(({ _id, archivedAt }) => (
  archivedAt === null && _id !== sourceAccountId
));

export const syncTransferDestinationAmount = (
  sourceAmount: string,
  currentDestinationAmount: string,
  sourceCurrency?: CurrencyCode,
  destinationCurrency?: CurrencyCode,
) => (sourceCurrency !== undefined && sourceCurrency === destinationCurrency
  ? sourceAmount
  : currentDestinationAmount);

export const hasValidTransferPrecision = (
  values: Pick<TransferFormValues, 'sourceAmount' | 'destinationAmount'>,
  source: TransferAccount,
  destination: TransferAccount,
) => (
  hasValidMoneyPrecision(Number(values.sourceAmount), source.currency)
  && hasValidMoneyPrecision(Number(values.destinationAmount), destination.currency)
);

export const getTransferEffectiveRate = (
  sourceAmount: string,
  destinationAmount: string,
) => {
  const source = Number(sourceAmount);
  const destination = Number(destinationAmount);
  return Number.isFinite(source) && source > 0 && Number.isFinite(destination) && destination > 0
    ? destination / source
    : null;
};

export const getTransferSubmissionIssue = (
  values: TransferFormValues,
  source?: TransferAccount,
  destination?: TransferAccount,
  originalSourceAmount = 0,
  allowArchivedAccounts = false,
  validateCurrentBalance = true,
) => {
  if (!source || !destination || (!allowArchivedAccounts
    && (source.archivedAt !== null || destination.archivedAt !== null))) {
    return 'accountUnavailable' as const;
  }
  if (!hasValidTransferPrecision(values, source, destination)) return 'precision' as const;
  if (
    source.currency === destination.currency
    && Number(values.sourceAmount) !== Number(values.destinationAmount)
  ) return 'sameCurrencyAmounts' as const;
  const extraDebit = Math.max(0, Number(values.sourceAmount) - originalSourceAmount);
  if (validateCurrentBalance && extraDebit > source.amount) return 'insufficientFunds' as const;
  return null;
};

export const mapCreateTransferDto = (values: TransferFormValues): CreateTransferDto => ({
  sourceAccountId: values.sourceAccountId,
  destinationAccountId: values.destinationAccountId,
  sourceAmount: Number(values.sourceAmount),
  destinationAmount: Number(values.destinationAmount),
  transactionDate: values.transactionDate,
  description: values.description.trim() || undefined,
});

export const mapUpdateTransferDto = (values: TransferFormValues): UpdateTransferDto => ({
  sourceAmount: Number(values.sourceAmount),
  destinationAmount: Number(values.destinationAmount),
  description: values.description.trim(),
});

interface TransferMutationError {
  response?: {
    status?: number;
    data?: { message?: string | string[] };
  };
}

export const isInsufficientTransferFundsError = (error: unknown) => {
  const response = (error as TransferMutationError | null)?.response;
  const messages = Array.isArray(response?.data?.message)
    ? response.data.message
    : [response?.data?.message];
  return response?.status === 400
    && messages.some((message) => message?.includes('Insufficient source funds'));
};
