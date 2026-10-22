import { useBudgetPermission } from '@/entities/budgets';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import {
  useAccountsQueryOptions,
  useArchiveAccountMutation,
  useDeleteAccountMutation,
  useRenameAccountMutation,
} from '@/entities/accounts';
import { formatMoney } from '@/shared/lib/currency';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { LucideSettings, LucideX } from 'lucide-react';
import {
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAccountMutationErrorKey,
} from '../model/account-form';

interface LifecycleAction { accountId: string; kind: 'archive' | 'delete' }

interface ManageAccountsButtonProps {
  accountId: string;
  onUnavailable?: () => void;
}

export function ManageAccountsButton({ accountId, onUnavailable }: ManageAccountsButtonProps) {
  const accountsQueryOptions = useAccountsQueryOptions();
  const allowed = useBudgetPermission('manageAccounts');
  const { t } = useTranslation();
  const accountsQuery = useQuery(accountsQueryOptions.findAll());
  const renameMutation = useRenameAccountMutation();
  const archiveMutation = useArchiveAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const [open, setOpen] = useState(false);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [action, setAction] = useState<LifecycleAction>();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string>();
  const beginLifecycle = (nextAction: LifecycleAction) => {
    setError(undefined);
    setAction(nextAction);
    setConfirmationOpen(true);
  };
  const accounts = accountsQuery.data ?? [];
  const visibleAccounts = accounts.filter((account) => account._id === accountId);

  const isPending = renameMutation.isPending || archiveMutation.isPending
    || deleteMutation.isPending;

  const rename = async (targetAccountId: string, currentName: string) => {
    const nextName = draftNames[targetAccountId]?.trim();
    if (!nextName || nextName === currentName) return;
    setError(undefined);
    try {
      await renameMutation.mutateAsync({ accountId: targetAccountId, payload: { name: nextName } });
      setDraftNames((current) => ({ ...current, [targetAccountId]: nextName }));
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const confirmLifecycle = async () => {
    if (!action || !confirmationOpen) return;
    setError(undefined);
    try {
      if (action.kind === 'archive') await archiveMutation.mutateAsync(action.accountId);
      else await deleteMutation.mutateAsync(action.accountId);
      setConfirmationOpen(false);
      setOpen(false);
      onUnavailable?.();
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  if (!allowed) return null;
  return (
    <>
      <Dialog.Base
        open={open}
        onOpenChange={(next) => {
          if (isPending) return;
          if (next) {
            setError(undefined);
          }
          setOpen(next);
        }}
      >
        <DialogPrimitive.Trigger
          render={(
            <Button.Icon
              aria-label={t('accounts.management.current')}
            />
)}
        >
          <LucideSettings />
        </DialogPrimitive.Trigger>
        <Dialog.Content className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden">
          <Dialog.Header>
            <Dialog.Title>{t('accounts.management.current')}</Dialog.Title>
            <Button.Icon
              aria-label={t('accounts.management.close')}
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              <LucideX />
            </Button.Icon>
          </Dialog.Header>
          <Dialog.Body className="min-h-0 overflow-y-auto">
            {(accountsQuery.isLoading) && (
              <p aria-live="polite">{t('accounts.loading')}</p>
            )}
            {(accountsQuery.isError) && (
              <p role="alert">{t('accounts.errors.load')}</p>
            )}
            {visibleAccounts.map((account) => (
              <div key={account._id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Typography.Body1>{formatMoney(account.amount, account.currency)}</Typography.Body1>
                    <Typography.Caption1>
                      {account.type === 'balance' ? t('accounts.types.balance') : t('accounts.types.saving')}
                      {' · '}
                      {account.archivedAt ? t('accounts.status.archived') : t('accounts.status.active')}
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
                    {account.archivedAt === null && (
                      <Button.Base
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => beginLifecycle({ accountId: account._id, kind: 'archive' })}
                      >
                        {t('accounts.management.archive')}
                      </Button.Base>
                    )}
                    <Button.Base
                      type="button"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => beginLifecycle({ accountId: account._id, kind: 'delete' })}
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
            {!accountsQuery.isLoading && !visibleAccounts.length && <p>{t('accounts.empty')}</p>}
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

      <AlertDialog.Base
        open={confirmationOpen}
        onOpenChange={(next) => !next && !isPending && setConfirmationOpen(false)}
      >
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
              onClick={() => setConfirmationOpen(false)}
            >
              {t('accounts.management.cancel')}
            </Button.Base>
            {error === 'restricted' && action?.kind === 'delete'
              && accounts.find((account) => account._id === action.accountId)?.archivedAt === null && (
              <Button.Base
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setAction({ accountId: action.accountId, kind: 'archive' });
                  setError(undefined);
                }}
              >
                {t('accounts.management.archive')}
              </Button.Base>
            )}
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
