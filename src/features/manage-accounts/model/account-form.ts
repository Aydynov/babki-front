interface AccountFormValues {
  name: string;
  type: 'balance' | 'saving';
  currency: string;
  amount: string;
  openedAt: string;
}

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildCreateAccountPayload = (values: AccountFormValues) => ({
  name: values.name.trim(),
  type: values.type,
  currency: values.currency,
  amount: Number(values.amount),
  openedAt: values.openedAt,
});

interface MutationError {
  response?: { status?: number };
}

export const getAccountMutationErrorKey = (error: unknown) => {
  const status = (error as MutationError | null)?.response?.status;
  if (status === 409) return 'restricted';
  if (status === 400) return 'validation';
  return 'generic';
};
