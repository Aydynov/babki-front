// Native node:test executes this module without Vite alias resolution and requires the explicit TypeScript entry point.
// eslint-disable-next-line import-x/extensions, import-x/no-useless-path-segments
import { hasValidMoneyPrecision, type CurrencyCode } from '../../../shared/lib/currency/index.ts';

interface AccountEligibilityView {
  _id: string;
  type: 'balance' | 'saving';
  currency: CurrencyCode;
  archivedAt: string | null;
}

export const getAccountStatus = (account: AccountEligibilityView) => (
  account.archivedAt === null ? 'active' : 'archived'
);

export const getActiveAccounts = <T extends AccountEligibilityView>(accounts: T[]) => (
  accounts.filter((account) => getAccountStatus(account) === 'active')
);

export const isDefaultAccountCandidate = (
  account: AccountEligibilityView,
  defaultCurrency: CurrencyCode,
) => (
  getAccountStatus(account) === 'active'
  && account.type === 'balance'
  && account.currency === defaultCurrency
);

export const getPreferredAccountId = <T extends AccountEligibilityView>(
  accounts: T[],
  defaultAccountId: string | null,
  isEligible: (account: T) => boolean = () => true,
) => accounts.find((account) => (
  account._id === defaultAccountId
  && getAccountStatus(account) === 'active'
  && isEligible(account)
))?._id ?? null;

export const hasValidInitialAmount = (amount: number, currency: CurrencyCode) => (
  amount >= 0 && hasValidMoneyPrecision(amount, currency)
);

export const getAccountSelectOptions = <T extends AccountEligibilityView>(
  accounts: T[],
  isEligible: (account: T) => boolean = () => true,
) => accounts.map((account) => ({
  account,
  disabledReason: account.archivedAt !== null
    ? 'archived' as const
    : (isEligible(account) ? null : 'incompatible' as const),
}));
