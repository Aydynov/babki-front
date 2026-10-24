import { useQuery } from '@tanstack/react-query';
import {
  type Plan,
  usePlansQueryOptions,
  useArchivePlanMutation,
  useClosePlanMutation,
  useRemovePlanMutation,
  useUpdatePlanMutation,
} from '@/entities/plans';
import { Dialog } from '@/shared/ui/dialog';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Button } from '@/shared/ui/button';
import { Typography } from '@/shared/ui/typography';
import {
  type FC, type RefObject, useEffect, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getMutationErrorMessage } from '../model/errors';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { PlanEditForm } from './plan-edit-form';
import { PlanExecuteForm } from './plan-execute-form';
import { PlanView } from './plan-view';

type Mode = 'view' | 'edit' | 'execute';

interface PlanDetailsDialogProps {
  plan: Plan;
  finalFocus: RefObject<HTMLElement | null>;
  fallbackFocus: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export const PlanDetailsDialog: FC<PlanDetailsDialogProps> = ({
  plan, finalFocus, fallbackFocus, onClose,
}) => {
  const { t } = useTranslation();
  const detail = useQuery(usePlansQueryOptions().findOne(plan._id));
  const [activePlan, setActivePlan] = useState(plan);
  const [mode, setMode] = useState<Mode>('view');
  const [confirmation, setConfirmation] = useState<'delete' | 'archive' | null>(null);
  const viewActionRef = useRef<HTMLButtonElement>(null);
  const executeRef = useRef<HTMLButtonElement>(null);
  const returnMode = useRef<Mode>('view');
  const contentRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);
  const updateMutation = useUpdatePlanMutation();
  const removeMutation = useRemovePlanMutation();
  const closeMutation = useClosePlanMutation();
  const archiveMutation = useArchivePlanMutation();
  const isPending = updateMutation.isPending || removeMutation.isPending
    || closeMutation.isPending || archiveMutation.isPending;

  useEffect(() => {
    if (detail.data) {
      setActivePlan(detail.data);
      if (detail.data.status === 'closed' || detail.data.archivedAt) setMode('view');
    }
  }, [detail.data]);

  useEffect(() => {
    if (mode === 'view') {
      const target = returnMode.current === 'execute' ? executeRef.current : viewActionRef.current;
      target?.focus();
    } else contentRef.current?.querySelector<HTMLElement>('input, button:not(:disabled)')?.focus();
  }, [mode]);

  const cancel = () => {
    if (isPending || confirmation) return;
    returnMode.current = mode;
    updateMutation.reset();
    closeMutation.reset();
    setMode('view');
  };
  const close = () => {
    if (!isPending && !confirmation) onClose();
  };
  const closeAfterMutation = () => {
    completed.current = true;
    onClose();
  };
  const cancelArchive = () => {
    if (archiveMutation.isPending) return;
    archiveMutation.reset();
    setConfirmation(null);
  };

  return (
    <>
      <ScrollDialog.Base
        open
        onOpenChange={(open, details) => {
          if (open) return;
          if (isPending || confirmation) {
            details.cancel();
            return;
          }
          if (mode !== 'view' && details.reason === 'escape-key') {
            details.cancel();
            cancel();
          } else onClose();
        }}
      >
        <ScrollDialog.Content
          ref={contentRef}
          finalFocus={() => (!completed.current && finalFocus.current?.isConnected
            ? finalFocus.current : fallbackFocus.current)}
        >
          {mode === 'view' && (
            <PlanView
              plan={activePlan}
              pending={isPending || Boolean(confirmation)}
              actionRef={viewActionRef}
              executeRef={executeRef}
              onEdit={() => setMode('edit')}
              onExecute={() => setMode('execute')}
              onDelete={() => setConfirmation('delete')}
              onArchive={() => setConfirmation('archive')}
              onClose={close}
            />
          )}
          {mode === 'edit' && (
            <PlanEditForm
              plan={activePlan}
              mutation={updateMutation}
              onCancel={cancel}
              onClose={close}
              onSuccess={(updated) => {
                if (updated) setActivePlan(updated);
                returnMode.current = 'edit';
                setMode('view');
              }}
            />
          )}
          {mode === 'execute' && (
            <PlanExecuteForm
              plan={activePlan}
              mutation={closeMutation}
              onCancel={cancel}
              onClose={close}
              onSuccess={closeAfterMutation}
            />
          )}
        </ScrollDialog.Content>
      </ScrollDialog.Base>
      <DeleteConfirmDialog
        open={confirmation === 'delete'}
        planId={activePlan._id}
        mutation={removeMutation}
        finalFocus={viewActionRef}
        onCancel={() => setConfirmation(null)}
        onConfirmed={closeAfterMutation}
      />
      <Dialog.Base
        open={confirmation === 'archive'}
        onOpenChange={(open, details) => {
          if (open) return;
          if (archiveMutation.isPending) details.cancel();
          else cancelArchive();
        }}
      >
        <Dialog.Content className="max-w-sm" finalFocus={viewActionRef}>
          <Dialog.Header><Dialog.Title>{t('plans.archive.title')}</Dialog.Title></Dialog.Header>
          <Dialog.Body>
            <Dialog.Description>{t('plans.archive.description')}</Dialog.Description>
            {archiveMutation.isError && (
              <Typography.Caption1 className="text-destructive">
                {getMutationErrorMessage(archiveMutation.error)}
              </Typography.Caption1>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Button.Base
              variant="outline"
              onClick={cancelArchive}
              disabled={archiveMutation.isPending}
            >
              {t('plans.delete.cancel')}
            </Button.Base>
            <Button.Base
              disabled={archiveMutation.isPending}
              onClick={async () => {
                try {
                  await archiveMutation.mutateAsync(activePlan._id);
                  closeAfterMutation();
                } catch { /* The confirmation keeps the mutation error available for retry. */ }
              }}
            >
              {archiveMutation.isPending ? t('plans.edit.saving') : t('plans.details.actions.archive')}
            </Button.Base>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </>
  );
};
