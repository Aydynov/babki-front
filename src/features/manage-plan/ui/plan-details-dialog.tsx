import { useQuery } from '@tanstack/react-query';
import { usePlansQueryOptions } from '@/entities/plans';
import {
  type Plan,
  useClosePlanMutation,
  useRemovePlanMutation,
  useUpdatePlanMutation,
} from '@/entities/plans';
import { Dialog } from '@/shared/ui/dialog';
import { type FC, useEffect, useState } from 'react';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { PlanEditForm } from './plan-edit-form';
import { PlanExecuteForm } from './plan-execute-form';
import { PlanView } from './plan-view';

type Mode = 'view' | 'edit' | 'execute';

interface PlanDetailsDialogProps {
  plan: Plan | null;
  onClose: () => void;
}

export const PlanDetailsDialog: FC<PlanDetailsDialogProps> = ({ plan, onClose }) => {
  const detail = useQuery({ ...usePlansQueryOptions().findOne(plan?._id ?? ''), enabled: Boolean(plan) });
  const [activePlan, setActivePlan] = useState<Plan | null>(plan);
  const [mode, setMode] = useState<Mode>('view');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateMutation = useUpdatePlanMutation();
  const removeMutation = useRemovePlanMutation();
  const closeMutation = useClosePlanMutation();

  const isPending = updateMutation.isPending || removeMutation.isPending || closeMutation.isPending;
  const open = Boolean(plan);

  useEffect(() => {
    if (detail.data) {
      setActivePlan(detail.data);
      if (detail.data.status === 'closed' || detail.data.archivedAt) setMode('view');
    } else if (plan) setActivePlan(plan);
  }, [plan, detail.data]);

  const resetState = () => {
    setMode('view');
    setConfirmingDelete(false);
    updateMutation.reset();
    removeMutation.reset();
    closeMutation.reset();
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) closeModal();
  };

  return (
    <>
      <Dialog.Base open={open} onOpenChange={handleOpenChange}>
        <Dialog.Content>
          {activePlan && mode === 'view' && (
            <PlanView
              plan={activePlan}
              onEdit={() => setMode('edit')}
              onExecute={() => setMode('execute')}
              onDelete={() => setConfirmingDelete(true)}
              onClose={() => handleOpenChange(false)}
            />
          )}

          {activePlan && mode === 'edit' && (
            <PlanEditForm
              plan={activePlan}
              mutation={updateMutation}
              onCancel={() => {
                updateMutation.reset();
                setMode('view');
              }}
              onSuccess={(updated) => {
                if (updated) setActivePlan(updated);
                setMode('view');
              }}
            />
          )}

          {activePlan && mode === 'execute' && (
            <PlanExecuteForm
              plan={activePlan}
              mutation={closeMutation}
              onCancel={() => {
                closeMutation.reset();
                setMode('view');
              }}
              onSuccess={closeModal}
            />
          )}
        </Dialog.Content>
      </Dialog.Base>

      {activePlan && (
        <DeleteConfirmDialog
          open={confirmingDelete}
          planId={activePlan._id}
          mutation={removeMutation}
          onCancel={() => setConfirmingDelete(false)}
          onConfirmed={closeModal}
        />
      )}
    </>
  );
};
