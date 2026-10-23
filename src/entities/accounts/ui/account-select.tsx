import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import type { FC } from 'react';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
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
  const options = getAccountSelectOptions(accounts, isEligible)
    .filter(({ disabledReason }) => disabledReason !== 'archived');
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

  const items = options.map(({ account, disabledReason }) => ({
    value: account._id,
    label: `${account.name} · ${formatMoney(account.amount, account.currency)}${
      disabledReason === 'incompatible' ? ` · ${t('accounts.status.unavailable')}` : ''
    }`,
    disabled: disabledReason !== null,
  }));

  return (
    <div>
      <Input.Label htmlFor={id}>{label}</Input.Label>
      <Select.Root
        items={items}
        value={value || null}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
        disabled={disabled}
      >
        <Select.Trigger id={id} size="form">
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content>
          {items.map((item) => (
            <Select.Item
              key={item.value}
              value={item.value}
              disabled={item.disabled}
            >
              {item.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  );
};
