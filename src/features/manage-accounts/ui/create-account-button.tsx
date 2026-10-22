import { BudgetLabel, useBudgetPermission } from '@/entities/budgets';
import {
  createAccountSchema,
  hasValidInitialAmount,
  subscribeAccountManagementRequests,
  useCreateAccountMutation,
} from '@/entities/accounts';
import { currencyCodes } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { LucidePlus, LucideX } from 'lucide-react';
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
      <Dialog.Base open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <Dialog.Content finalFocus={() => (
          finalFocus.current?.isConnected ? finalFocus.current
            : originatingDialog.current?.querySelector<HTMLSelectElement>('select:not(:disabled)') ?? true
        )}
        >
          <BudgetLabel />
          <Dialog.Header>
            <Dialog.Title>{t('accounts.management.new')}</Dialog.Title>
            <Button.Icon
              aria-label={t('accounts.management.close')}
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              <LucideX />
            </Button.Icon>
          </Dialog.Header>
          <Dialog.Body>
            <form className="flex flex-col gap-4" onSubmit={submitCreate}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${fieldId}-name`} className="text-body-2 font-medium">
                  {t('accounts.management.name')}
                </label>
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
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${fieldId}-type`} className="text-body-2 font-medium">
                    {t('accounts.details.type')}
                  </label>
                  <Select.Root
                    disabled={isPending}
                    value={type}
                    onValueChange={(value) => {
                      if (value === 'balance' || value === 'saving') setType(value);
                    }}
                  >
                    <Select.Trigger id={`${fieldId}-type`} className="w-full data-[size=default]:h-11">
                      <Select.Value>{t(`accounts.types.${type}`)}</Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="balance">{t('accounts.types.balance')}</Select.Item>
                      <Select.Item value="saving">{t('accounts.types.saving')}</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${fieldId}-currency`} className="text-body-2 font-medium">
                    {t('accounts.details.currency')}
                  </label>
                  <Select.Root
                    disabled={isPending}
                    value={currency}
                    onValueChange={(value) => {
                      if (value) setCurrency(value);
                    }}
                  >
                    <Select.Trigger id={`${fieldId}-currency`} className="w-full data-[size=default]:h-11">
                      <Select.Value>{currency}</Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      {currencyCodes.map((code) => <Select.Item key={code} value={code}>{code}</Select.Item>)}
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${fieldId}-amount`} className="text-body-2 font-medium">
                  {t('accounts.status.initialAmount')}
                </label>
                <Input.Base
                  id={`${fieldId}-amount`}
                  aria-invalid={hasAmountPrecisionError || undefined}
                  aria-describedby={hasAmountPrecisionError ? `${fieldId}-precision` : undefined}
                  disabled={isPending}
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  hasError={hasAmountPrecisionError}
                  onChange={(event) => setAmount(event.target.value)}
                />
                {hasAmountPrecisionError && (
                  <Input.Error id={`${fieldId}-precision`}>{t('accounts.errors.precision')}</Input.Error>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${fieldId}-opened-at`} className="text-body-2 font-medium">
                  {t('accounts.management.openingDate')}
                </label>
                <Input.Base
                  id={`${fieldId}-opened-at`}
                  disabled={isPending}
                  type="date"
                  value={openedAt}
                  onChange={(event) => setOpenedAt(event.target.value)}
                />
              </div>
              <Button.Base type="submit" disabled={isPending || !canCreate}>
                <LucidePlus />
                {t('accounts.management.add')}
              </Button.Base>
            </form>
            {error && <p role="alert">{t('accounts.errors.action')}</p>}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Base>
    </>
  );
}
