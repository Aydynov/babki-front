import { useQuery } from '@tanstack/react-query';
import { useDebtsQueryOptions } from '@/entities/debts';
import {
  type Debt,
  useDeleteDebtMutation,
  useRepayDebtMutation,
  useUpdateDebtMutation,
} from '@/entities/debts';
import { Dialog } from '@/shared/ui/dialog';
import { type FC, useEffect, useState } from 'react';
import { DebtEditForm } from './debt-edit-form';
import { DebtRepayForm } from './debt-repay-form';
import { DebtView } from './debt-view';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

type Mode = 'view' | 'edit' | 'repay';

interface DebtDetailsDialogProps {
  debt: Debt | null;
  onClose: () => void;
}

export const DebtDetailsDialog: FC<DebtDetailsDialogProps> = ({ debt, onClose }) => {
  const detail = useQuery({ ...useDebtsQueryOptions().findOne(debt?._id ?? ''), enabled: Boolean(debt) });
  const [activeDebt, setActiveDebt] = useState<Debt | null>(debt);
  const [mode, setMode] = useState<Mode>('view');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateMutation = useUpdateDebtMutation();
  const repayMutation = useRepayDebtMutation();
  const deleteMutation = useDeleteDebtMutation();

  const isPending = updateMutation.isPending || repayMutation.isPending || deleteMutation.isPending;
  const open = Boolean(debt);

  useEffect(() => {
    if (detail.data) setActiveDebt(detail.data);
    else if (debt) setActiveDebt(debt);
  }, [debt, detail.data]);

  const resetState = () => {
    setMode('view');
    setConfirmingDelete(false);
    updateMutation.reset();
    repayMutation.reset();
    deleteMutation.reset();
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) closeModal();
  };

  const handleRepaymentSuccess = (updated: Debt | null) => {
    if (!updated || updated.status === 'closed' || updated.remainingAmount === 0) {
      closeModal();
      return;
    }

    setActiveDebt(updated);
    setMode('view');
  };

  return (
    <>
      <Dialog.Base open={open} onOpenChange={handleOpenChange}>
        <Dialog.Content>
          {activeDebt && mode === 'view' && (
            <DebtView
              debt={activeDebt}
              onEdit={() => setMode('edit')}
              onRepay={() => setMode('repay')}
              onDelete={() => setConfirmingDelete(true)}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {activeDebt && mode === 'edit' && (
            <DebtEditForm
              debt={activeDebt}
              mutation={updateMutation}
              onCancel={() => {
                updateMutation.reset();
                setMode('view');
              }}
              onSuccess={(updated) => {
                if (updated) setActiveDebt(updated);
                setMode('view');
              }}
            />
          )}

          {activeDebt && mode === 'repay' && (
            <DebtRepayForm
              debt={activeDebt}
              mutation={repayMutation}
              onCancel={() => {
                repayMutation.reset();
                setMode('view');
              }}
              onSuccess={handleRepaymentSuccess}
            />
          )}
        </Dialog.Content>
      </Dialog.Base>

      {activeDebt && (
        <DeleteConfirmDialog
          open={confirmingDelete}
          debtId={activeDebt._id}
          mutation={deleteMutation}
          onCancel={() => setConfirmingDelete(false)}
          onConfirmed={closeModal}
        />
      )}
    </>
  );
};
