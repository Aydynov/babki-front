import { Dialog as DialogPrimitive } from '@base-ui/react';
import {
  accountsQueryOptions,
  createAccountSchema,
  hasValidInitialAmount,
  isDefaultAccountCandidate,
  subscribeAccountManagementRequests,
  useArchiveAccountMutation,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useRenameAccountMutation,
} from '@/entities/accounts';
import { usersQueryOptions, useUpdateCurrentUserMutation } from '@/entities/users';
import { currencyCodes, formatMoney } from '@/shared/lib/currency';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LucidePlus, LucideSettings, LucideX } from 'lucide-react';
import {
  type FormEvent, useCallback, useEffect, useMemo, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildCreateAccountPayload,
  getAccountMutationErrorKey,
  getLocalDateString,
} from '../model/account-form';
import { invalidateAccountDependents } from '../model/cache';

interface LifecycleAction { accountId: string; kind: 'archive' | 'delete' }

export function ManageAccountsButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const userQuery = useQuery(usersQueryOptions.me());
  const createMutation = useCreateAccountMutation();
  const renameMutation = useRenameAccountMutation();
  const archiveMutation = useArchiveAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const updateUserMutation = useUpdateCurrentUserMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'balance' | 'saving'>('balance');
  const [currency, setCurrency] = useState('RUB');
  const [amount, setAmount] = useState('0');
  const [openedAt, setOpenedAt] = useState(getLocalDateString);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [action, setAction] = useState<LifecycleAction>();
  const [error, setError] = useState<string>();
  const accounts = accountsQuery.data ?? [];
  const user = userQuery.data;

  const resetCreateForm = useCallback(() => {
    setName('');
    setType('balance');
    setCurrency(user?.defaultCurrency ?? 'RUB');
    setAmount('0');
    setOpenedAt(getLocalDateString());
  }, [user?.defaultCurrency]);

  useEffect(() => {
    if (user?.defaultCurrency) setCurrency(user.defaultCurrency);
  }, [user?.defaultCurrency]);

  useEffect(() => subscribeAccountManagementRequests(() => {
    resetCreateForm();
    setOpen(true);
  }), [resetCreateForm]);
  const isPending = createMutation.isPending || renameMutation.isPending
    || archiveMutation.isPending || deleteMutation.isPending || updateUserMutation.isPending;
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
      invalidateAccountDependents(queryClient);
      resetCreateForm();
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const rename = async (accountId: string, currentName: string) => {
    const nextName = draftNames[accountId]?.trim();
    if (!nextName || nextName === currentName) return;
    try {
      await renameMutation.mutateAsync({ accountId, payload: { name: nextName } });
      invalidateAccountDependents(queryClient);
      setDraftNames((current) => ({ ...current, [accountId]: nextName }));
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const confirmLifecycle = async () => {
    if (!action) return;
    setError(undefined);
    try {
      if (action.kind === 'archive') await archiveMutation.mutateAsync(action.accountId);
      else await deleteMutation.mutateAsync(action.accountId);
      invalidateAccountDependents(queryClient);
      setAction(undefined);
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const selectDefaultAccount = async (accountId: string) => {
    setError(undefined);
    try {
      await updateUserMutation.mutateAsync({ defaultAccountId: accountId });
      invalidateAccountDependents(queryClient);
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  return (
    <>
      <Dialog.Base
        open={open}
        onOpenChange={(next) => {
          if (isPending) return;
          if (next) resetCreateForm();
          setOpen(next);
        }}
      >
        <DialogPrimitive.Trigger render={<Button.Icon aria-label={t('accounts.management.open')} />}>
          <LucideSettings />
        </DialogPrimitive.Trigger>
        <Dialog.Content className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden">
          <Dialog.Header>
            <Dialog.Title>{t('accounts.title')}</Dialog.Title>
            <Button.Icon
              aria-label={t('accounts.management.close')}
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              <LucideX />
            </Button.Icon>
          </Dialog.Header>
          <Dialog.Body className="min-h-0 overflow-y-auto">
            {(accountsQuery.isLoading || userQuery.isLoading) && (
              <p aria-live="polite">{t('accounts.loading')}</p>
            )}
            {(accountsQuery.isError || userQuery.isError) && (
              <p role="alert">{t('accounts.errors.load')}</p>
            )}
            {accounts.map((account) => (
              <div key={account._id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Typography.Body1>{formatMoney(account.amount, account.currency)}</Typography.Body1>
                    <Typography.Caption1>
                      {account.type === 'balance' ? t('accounts.types.balance') : t('accounts.types.saving')}
                      {' · '}
                      {account.archivedAt ? t('accounts.status.archived') : t('accounts.status.active')}
                      {user?.defaultAccountId === account._id ? ` · ${t('accounts.status.default')}` : ''}
                    </Typography.Caption1>
                    <Typography.Caption1 className="block text-muted-foreground">
                      {t('accounts.status.initialAmount')}
                      {': '}
                      {formatMoney(account.initialAmount, account.currency)}
                      {' · '}
                      {t('accounts.status.openedAt')}
                      {': '}
                      {new Date(account.openedAt).toLocaleDateString('ru-RU')}
                    </Typography.Caption1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user && isDefaultAccountCandidate(account, user.defaultCurrency) && (
                      <Button.Base
                        type="button"
                        variant="outline"
                        disabled={isPending || user.defaultAccountId === account._id}
                        onClick={() => selectDefaultAccount(account._id)}
                      >
                        {t('accounts.management.makeDefault')}
                      </Button.Base>
                    )}
                    {account.archivedAt === null && (
                      <Button.Base
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setAction({ accountId: account._id, kind: 'archive' })}
                      >
                        {t('accounts.management.archive')}
                      </Button.Base>
                    )}
                    <Button.Base
                      type="button"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setAction({ accountId: account._id, kind: 'delete' })}
                    >
                      {t('accounts.management.delete')}
                    </Button.Base>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input.Base
                    aria-label={t('accounts.management.name')}
                    value={draftNames[account._id] ?? account.name}
                    disabled={isPending}
                    maxLength={100}
                    onChange={(event) => setDraftNames((current) => ({
                      ...current,
                      [account._id]: event.target.value,
                    }))}
                  />
                  <Button.Base
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => rename(account._id, account.name)}
                  >
                    {t('accounts.management.save')}
                  </Button.Base>
                </div>
              </div>
            ))}
            {!accountsQuery.isLoading && !accounts.length && <p>{t('accounts.empty')}</p>}
            <form className="flex flex-col gap-3 rounded-lg border p-3" onSubmit={submitCreate}>
              <Typography.Title3>{t('accounts.management.new')}</Typography.Title3>
              <Input.Base
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('accounts.management.namePlaceholder')}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                  <option value="balance">{t('accounts.types.balance')}</option>
                  <option value="saving">{t('accounts.types.saving')}</option>
                </select>
                <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {currencyCodes.map((code) => <option key={code}>{code}</option>)}
                </select>
                <div>
                  <Input.Base
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    hasError={hasAmountPrecisionError}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  {hasAmountPrecisionError && (
                    <Input.Error>{t('accounts.errors.precision')}</Input.Error>
                  )}
                </div>
                <Input.Base
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
            {error && (
              <p role="alert">
                {error === 'restricted'
                  ? t('accounts.errors.restricted')
                  : t('accounts.errors.action')}
              </p>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Base>

      <AlertDialog.Base open={Boolean(action)} onOpenChange={(next) => !next && !isPending && setAction(undefined)}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>
              {action?.kind === 'delete'
                ? t('accounts.management.deleteTitle')
                : t('accounts.management.archiveTitle')}
            </AlertDialog.Title>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <AlertDialog.Description>{t('accounts.management.lifecycleDescription')}</AlertDialog.Description>
            {error && (
              <Typography.Caption1 className="text-destructive" role="alert">
                {error === 'restricted'
                  ? t('accounts.errors.restricted')
                  : t('accounts.errors.action')}
              </Typography.Caption1>
            )}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Base
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setAction(undefined)}
            >
              {t('accounts.management.cancel')}
            </Button.Base>
            <Button.Base
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={confirmLifecycle}
            >
              {t('accounts.management.confirm')}
            </Button.Base>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Base>
    </>
  );
}
