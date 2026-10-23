import { useBudgetPermission } from '@/entities/budgets';
import {
  createAccountSchema,
  hasValidInitialAmount,
  subscribeAccountManagementRequests,
  useCreateAccountMutation,
} from '@/entities/accounts';
import { currencyCodes } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { LucidePlus } from 'lucide-react';
import {
  type FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { buildCreateAccountPayload, getAccountMutationErrorKey, getLocalDateString } from '../model/account-form';

export function CreateAccountButton({ hidden = false }: { hidden?: boolean }) {
  const allowed = useBudgetPermission('manageAccounts');
  const { t } = useTranslation();
  const fieldId = useId();
  const createMutation = useCreateAccountMutation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const finalFocus = useRef<HTMLElement | null>(null);
  const originatingDialog = useRef<HTMLElement | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'balance' | 'saving'>('balance');
  const [currency, setCurrency] = useState('RUB');
  const [amount, setAmount] = useState('');
  const [openedAt, setOpenedAt] = useState(getLocalDateString);
  const resetCreateForm = useCallback(() => {
    setName('');
    setType('balance');
    setCurrency('RUB');
    setAmount('');
    setOpenedAt(getLocalDateString());
  }, []);

  useEffect(() => subscribeAccountManagementRequests(() => {
    finalFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    originatingDialog.current = finalFocus.current?.closest<HTMLElement>('[role="dialog"]') ?? null;
    if (!allowed) return;
    resetCreateForm();
    setError(undefined);
    setOpen(true);
  }), [resetCreateForm, allowed]);
  const { isPending } = createMutation;
  const payload = useMemo(() => buildCreateAccountPayload({
    name,
    type,
    currency,
    amount,
    openedAt,
  }), [amount, currency, name, openedAt, type]);
  const canCreate = createAccountSchema.safeParse(payload).success
    && hasValidInitialAmount(payload.amount, payload.currency);
  const hasAmountPrecisionError = Number.isFinite(payload.amount)
    && payload.amount >= 0
    && !hasValidInitialAmount(payload.amount, payload.currency);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    setError(undefined);
    try {
      await createMutation.mutateAsync(payload);
      resetCreateForm();
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  if (!allowed) return null;

  return (
    <>
      {!hidden && (
        <Button.Icon
          aria-label={t('accounts.management.add')}
          onClick={(event) => {
            finalFocus.current = event.currentTarget;
            originatingDialog.current = null;
            resetCreateForm();
            setError(undefined);
            setOpen(true);
          }}
        >
          <LucidePlus />
        </Button.Icon>
      )}
      <ScrollDialog.Base open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <ScrollDialog.Content finalFocus={() => (
          finalFocus.current?.isConnected ? finalFocus.current
            : originatingDialog.current?.querySelector<HTMLSelectElement>('select:not(:disabled)') ?? true
        )}
        >
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitCreate}>
            <ScrollDialog.Layout
              title={t('accounts.management.new')}
              closeLabel={t('accounts.management.close')}
              onClose={() => setOpen(false)}
              closeDisabled={isPending}
              actions={(
                <Button.Base type="submit" disabled={isPending || !canCreate}>
                  <LucidePlus />
                  {t('accounts.management.add')}
                </Button.Base>
              )}
            >
              <div>
                <Input.Label htmlFor={`${fieldId}-name`}>
                  {t('accounts.management.name')}
                </Input.Label>
                <Input.Base
                  id={`${fieldId}-name`}
                  maxLength={100}
                  disabled={isPending}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('accounts.management.namePlaceholder')}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input.Label htmlFor={`${fieldId}-type`}>
                    {t('accounts.details.type')}
                  </Input.Label>
                  <Select.Root
                    disabled={isPending}
                    value={type}
                    onValueChange={(value) => {
                      if (value === 'balance' || value === 'saving') setType(value);
                    }}
                  >
                    <Select.Trigger id={`${fieldId}-type`} size="form">
                      <Select.Value placeholder={t('accounts.management.typePlaceholder')}>
                        {t(`accounts.types.${type}`)}
                      </Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="balance">{t('accounts.types.balance')}</Select.Item>
                      <Select.Item value="saving">{t('accounts.types.saving')}</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
                <div>
                  <Input.Label htmlFor={`${fieldId}-currency`}>
                    {t('accounts.details.currency')}
                  </Input.Label>
                  <Select.Root
                    disabled={isPending}
                    value={currency}
                    onValueChange={(value) => {
                      if (value) setCurrency(value);
                    }}
                  >
                    <Select.Trigger id={`${fieldId}-currency`} size="form">
                      <Select.Value placeholder={t('accounts.management.currencyPlaceholder')}>{currency}</Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      {currencyCodes.map((code) => <Select.Item key={code} value={code}>{code}</Select.Item>)}
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
              <div>
                <Input.Label htmlFor={`${fieldId}-amount`}>
                  {t('accounts.status.initialAmount')}
                </Input.Label>
                <Input.Base
                  id={`${fieldId}-amount`}
                  aria-invalid={hasAmountPrecisionError || undefined}
                  aria-describedby={hasAmountPrecisionError ? `${fieldId}-precision` : undefined}
                  disabled={isPending}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  hasError={hasAmountPrecisionError}
                  onChange={(event) => setAmount(event.target.value)}
                />
                {hasAmountPrecisionError && (
                  <Input.Error id={`${fieldId}-precision`}>{t('accounts.errors.precision')}</Input.Error>
                )}
              </div>
              <div>
                <Input.Label htmlFor={`${fieldId}-opened-at`}>
                  {t('accounts.management.openingDate')}
                </Input.Label>
                <Input.Base
                  id={`${fieldId}-opened-at`}
                  disabled={isPending}
                  type="date"
                  placeholder={t('accounts.management.openingDatePlaceholder')}
                  value={openedAt}
                  onChange={(event) => setOpenedAt(event.target.value)}
                />
              </div>
              {error && <p role="alert">{t('accounts.errors.action')}</p>}
            </ScrollDialog.Layout>
          </form>
        </ScrollDialog.Content>
      </ScrollDialog.Base>
    </>
  );
}
