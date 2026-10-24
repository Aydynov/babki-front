import { useBudgetPermission } from '@/entities/budgets';
import { Menu } from '@base-ui/react';
import {
  useAccountsQueryOptions,
  useArchiveAccountMutation,
  useDeleteAccountMutation,
  useRenameAccountMutation,
} from '@/entities/accounts';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAccountMutationErrorKey } from '../model/account-form';

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [action, setAction] = useState<LifecycleAction>();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string>();
  const beginLifecycle = (kind: LifecycleAction['kind']) => {
    setError(undefined);
    setAction({ accountId, kind });
    setConfirmationOpen(true);
  };
  const accounts = accountsQuery.data ?? [];
  const account = accounts.find((item) => item._id === accountId);
  const nextName = name.trim();
  const valid = nextName.length > 0 && nextName.length <= 100;
  const isPending = renameMutation.isPending || archiveMutation.isPending || deleteMutation.isPending;
  const closeEdit = () => {
    if (!isPending) setOpen(false);
  };

  const rename = async () => {
    if (!account || !valid || isPending) return;
    setError(undefined);
    try {
      if (nextName !== account.name) {
        await renameMutation.mutateAsync({ accountId, payload: { name: nextName } });
      }
      setOpen(false);
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const confirmLifecycle = async () => {
    if (!action || !confirmationOpen || isPending) return;
    setError(undefined);
    try {
      if (action.kind === 'archive') await archiveMutation.mutateAsync(action.accountId);
      else await deleteMutation.mutateAsync(action.accountId);
      setConfirmationOpen(false);
      onUnavailable?.();
    } catch (mutationError) {
      setError(getAccountMutationErrorKey(mutationError));
    }
  };

  const menuItemClass = `
    flex h-8 cursor-default items-center rounded-md px-2 text-sm outline-none
    data-highlighted:bg-accent data-disabled:opacity-50
  `;

  if (!allowed) return null;
  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          ref={triggerRef}
          aria-label={t('accounts.management.actions')}
          disabled={isPending || !account}
          render={<Button.Icon type="button" />}
        >
          <Icon icon="IcDots20" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            align="end"
            sideOffset={4}
            className="z-50 outline-none"
          >
            <Menu.Popup className="rounded-lg border bg-popover p-1 shadow-md outline-none">
              <Menu.Item
                label={t('accounts.management.edit')}
                className={menuItemClass}
                onClick={() => {
                  if (!account) return;
                  setName(account.name);
                  setError(undefined);
                  setOpen(true);
                }}
              >
                {t('accounts.management.edit')}
              </Menu.Item>
              {account?.archivedAt === null && (
                <Menu.Item
                  label={t('accounts.management.archive')}
                  className={menuItemClass}
                  onClick={() => beginLifecycle('archive')}
                >
                  {t('accounts.management.archive')}
                </Menu.Item>
              )}
              <Menu.Item
                label={t('accounts.management.delete')}
                className={`${menuItemClass} text-destructive data-highlighted:bg-destructive/10`}
                onClick={() => beginLifecycle('delete')}
              >
                {t('accounts.management.delete')}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <ScrollDialog.Base open={open} onOpenChange={(next) => !next && closeEdit()}>
        <ScrollDialog.Content finalFocus={triggerRef}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await rename();
            }}
          >
            <ScrollDialog.Layout
              title={t('accounts.management.editTitle')}
              closeLabel={t('accounts.management.close')}
              onClose={closeEdit}
              closeDisabled={isPending}
              actions={(
                <Button.Base type="submit" disabled={isPending || !valid || !account}>
                  {t('accounts.management.save')}
                </Button.Base>
              )}
            >
              <div>
                <Input.Label htmlFor={`account-name-${accountId}`}>
                  {t('accounts.management.name')}
                </Input.Label>
                <Input.Base
                  id={`account-name-${accountId}`}
                  value={name}
                  disabled={isPending}
                  maxLength={100}
                  required
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              {error && (
                <Typography.Caption1 className="text-destructive" role="alert">
                  {error === 'restricted' ? t('accounts.errors.restricted') : t('accounts.errors.action')}
                </Typography.Caption1>
              )}
            </ScrollDialog.Layout>
          </form>
        </ScrollDialog.Content>
      </ScrollDialog.Base>

      <AlertDialog.Base
        open={confirmationOpen}
        onOpenChange={(next) => !next && !isPending && setConfirmationOpen(false)}
      >
        <AlertDialog.Content finalFocus={triggerRef}>
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
              && account?.archivedAt === null && (
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
