import { useCanManageRecord } from '@/entities/budgets';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useQuery } from '@tanstack/react-query';
import type { Expense } from '@/entities/expenses';
import { useDeleteTransactionMutation } from '@/entities/transactions';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Menu } from '@base-ui/react';
import {
  LucidePencil,
  LucideX,
} from 'lucide-react';
import {
  type FC,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { EditExpenseDialog } from './edit-expense-dialog';

interface ExpenseActionsProps {
  expense: Expense;
}

export const ExpenseActions: FC<ExpenseActionsProps> = ({
  expense,
}) => {
  const allowed = useCanManageRecord(expense.createdBy, expense.participantId);
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const archived = accounts.data?.find((a) => a._id === expense.accountId)?.archivedAt;
  const { t } = useTranslation();
  const deleteMutation = useDeleteTransactionMutation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleEditRequest = () => {
    setEditSession((value) => value + 1);
    setEditOpen(true);
  };

  const handleDeleteRequest = () => {
    deleteMutation.reset();
    setDeleteOpen(true);
  };

  const handleCancel = () => {
    if (deleteMutation.isPending) return;
    setDeleteOpen(false);
    deleteMutation.reset();
  };

  const handleConfirm = async () => {
    await deleteMutation.mutateAsync({ transactionId: expense._id, transactionType: 'expense' });
    setDeleteOpen(false);
  };

  if (!allowed || archived) return null;
  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          ref={triggerRef}
          aria-label={t('expenses.actions.open')}
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
            <Menu.Popup
              className="rounded-lg border bg-popover p-1 shadow-md outline-none"
            >
              <Menu.Item
                aria-label={t('expenses.actions.edit')}
                label={t('expenses.actions.edit')}
                className="
                  flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none
                  data-highlighted:bg-accent
                "
                onClick={handleEditRequest}
              >
                <LucidePencil size={16} />
                <span>{t('expenses.actions.editLabel')}</span>
              </Menu.Item>
              <Menu.Item
                aria-label={t('expenses.actions.delete')}
                label={t('expenses.actions.delete')}
                className="
                  flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm text-destructive outline-none
                  data-highlighted:bg-destructive/10
                "
                onClick={handleDeleteRequest}
              >
                <LucideX size={16} />
                <span>{t('expenses.actions.deleteLabel')}</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <EditExpenseDialog
        key={editSession}
        expense={expense}
        open={editOpen}
        finalFocus={triggerRef}
        onClose={() => setEditOpen(false)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        pending={deleteMutation.isPending}
        error={deleteMutation.isError ? t('expenses.errors.delete') : undefined}
        finalFocus={triggerRef}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
};
