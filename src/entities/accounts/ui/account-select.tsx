import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import type { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { Account } from '../model/schemas';
import { getAccountSelectOptions } from '../model/account-eligibility';
import { requestAccountManagement } from '../model/account-management-events';

interface AccountSelectProps {
  id: string;
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  emptyMessage: string;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
  isEligible?: (account: Account) => boolean;
  offerAccountCreation?: boolean;
}

export const AccountSelect: FC<AccountSelectProps> = ({
  id,
  accounts,
  value,
  onValueChange,
  label,
  placeholder,
  emptyMessage,
  isLoading = false,
  error,
  disabled = false,
  isEligible,
  offerAccountCreation = false,
}) => {
  const { t } = useTranslation();
  const options = getAccountSelectOptions(accounts, isEligible);
  const hasEligibleAccount = options.some(({ disabledReason }) => disabledReason === null);

  if (isLoading) {
    return <p aria-live="polite">{t('accounts.loading')}</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!hasEligibleAccount) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>{emptyMessage}</p>
        {offerAccountCreation && (
          <Button.Base
            type="button"
            variant="outline"
            onClick={requestAccountManagement}
          >
            {t('accounts.management.createAction')}
          </Button.Base>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="h-11 w-full rounded-lg border bg-background px-3 py-2 text-body-2"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onValueChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(({ account, disabledReason }) => (
          <option
            key={account._id}
            value={account._id}
            disabled={disabledReason !== null}
          >
            {account.name}
            {' · '}
            {formatMoney(account.amount, account.currency)}
            {disabledReason === 'archived' ? ` · ${t('accounts.status.archivedShort')}` : ''}
            {disabledReason === 'incompatible' ? ` · ${t('accounts.status.unavailable')}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
