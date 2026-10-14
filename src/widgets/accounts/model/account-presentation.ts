import type { Account, AccountType } from '@/entities/accounts';
import type { Transfer } from '@/entities/transfers';

type AccountListMode = 'active' | 'archived';

export const groupAccounts = (
  accounts: Account[],
  defaultCurrency: string,
  locale: string,
  mode: AccountListMode = 'active',
) => (
  (['balance', 'saving'] as const).map((type: AccountType) => ({
    type,
    accounts: accounts.filter((account) => (
      account.type === type && (mode === 'active' ? account.archivedAt === null : account.archivedAt !== null)
    ))
      .sort((left, right) => (
        Number(right.currency === defaultCurrency) - Number(left.currency === defaultCurrency)
        || left.currency.localeCompare(right.currency)
        || left.name.localeCompare(right.name, locale)
        || left._id.localeCompare(right._id)
      )),
  })).filter((group) => group.accounts.length > 0)
);

export const getTransferEffects = (transfers: Transfer[], accountId: string) => (
  transfers.filter(({ source, destination }) => source.accountId === accountId || destination.accountId === accountId)
    .map((transfer) => {
      const outgoing = transfer.source.accountId === accountId;
      const effect = outgoing ? transfer.source : transfer.destination;
      return {
        _id: transfer._id,
        transactionDate: transfer.transactionDate,
        amount: effect.amount * (outgoing ? -1 : 1),
        currency: effect.currency,
        counterpartyId: outgoing ? transfer.destination.accountId : transfer.source.accountId,
      };
    }).sort((left, right) => (
      Date.parse(right.transactionDate) - Date.parse(left.transactionDate)
      || right._id.localeCompare(left._id)
    ))
);
