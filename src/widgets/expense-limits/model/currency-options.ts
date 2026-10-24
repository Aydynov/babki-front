import type { Account } from '@/entities/accounts';

export const getExpenseLimitCurrencies = (accounts: readonly Pick<Account, 'currency'>[]) => (
  [...new Set(accounts.map(({ currency }) => currency))].sort()
);
