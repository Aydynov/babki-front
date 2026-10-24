import { useQuery } from '@tanstack/react-query';
import {
  type Debt,
  useDebtsQueryOptions,
  useDeleteDebtMutation,
  useRepayDebtMutation,
  useUpdateDebtMutation,
  useArchiveDebtMutation,
  useCancelDebtRepaymentMutation,
} from '@/entities/debts';
import { Dialog } from '@/shared/ui/dialog';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Button } from '@/shared/ui/button';
import { Typography } from '@/shared/ui/typography';
import {
  type FC, type RefObject, useEffect, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getMutationErrorMessage } from '../model/errors';
import { DebtEditForm } from './debt-edit-form';
import { DebtRepayForm } from './debt-repay-form';
import { DebtView } from './debt-view';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

type Mode = 'view' | 'edit' | 'repay';

interface DebtDetailsDialogProps {
  debt: Debt;
  finalFocus: RefObject<HTMLElement | null>;
  fallbackFocus: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export const DebtDetailsDialog: FC<DebtDetailsDialogProps> = ({
  debt, finalFocus, fallbackFocus, onClose,
}) => {
  const { t } = useTranslation();
  const detail = useQuery(useDebtsQueryOptions().findOne(debt._id));
  const [activeDebt, setActiveDebt] = useState(debt);
  const [mode, setMode] = useState<Mode>('view');
  const [confirmation, setConfirmation] = useState<'delete' | 'archive' | null>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const repayRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const returnMode = useRef<Mode>('view');
  const updateMutation = useUpdateDebtMutation();
  const repayMutation = useRepayDebtMutation();
  const deleteMutation = useDeleteDebtMutation();
  const archiveMutation = useArchiveDebtMutation();
  const cancelMutation = useCancelDebtRepaymentMutation();
  const isPending = updateMutation.isPending || repayMutation.isPending || deleteMutation.isPending
    || archiveMutation.isPending || cancelMutation.isPending;

  useEffect(() => {
    if (detail.data) {
      const updated = detail.data;
      setActiveDebt(updated);
      setMode((current) => (updated.archivedAt || (current === 'repay' && updated.status === 'closed')
        ? 'view' : current));
    }
  }, [detail.data]);

  useEffect(() => {
    if (mode === 'view') {
      const target = returnMode.current === 'repay' ? repayRef.current : actionRef.current;
      target?.focus();
    } else contentRef.current?.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')?.focus();
  }, [mode]);

  const cancel = () => {
    if (isPending || confirmation) return;
    returnMode.current = mode;
    updateMutation.reset();
    repayMutation.reset();
    setMode('view');
  };
  const close = () => {
    if (!isPending && !confirmation) onClose();
  };
  const cancelArchive = () => {
    if (archiveMutation.isPending) return;
    archiveMutation.reset();
    setConfirmation(null);
  };

  const handleRepaymentSuccess = (updated: Debt | null) => {
    if (!updated || updated.status === 'closed' || updated.remainingAmount === 0) {
      onClose();
      return;
    }
    returnMode.current = 'repay';
    setActiveDebt(updated);
    setMode('view');
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
          finalFocus={() => (finalFocus.current?.isConnected ? finalFocus.current : fallbackFocus.current)}
        >
          {mode === 'view' && (
            <DebtView
              debt={activeDebt}
              pending={isPending || Boolean(confirmation)}
              cancel={cancelMutation}
              actionRef={actionRef}
              repayRef={repayRef}
              onEdit={() => setMode('edit')}
              onRepay={() => setMode('repay')}
              onArchive={() => setConfirmation('archive')}
              onDelete={() => setConfirmation('delete')}
              onClose={close}
            />
          )}
          {mode === 'edit' && (
            <DebtEditForm
              debt={activeDebt}
              mutation={updateMutation}
              onCancel={cancel}
              onClose={close}
              onSuccess={(updated) => {
                if (updated) setActiveDebt(updated);
                returnMode.current = 'edit';
                setMode('view');
              }}
            />
          )}
          {mode === 'repay' && (
            <DebtRepayForm
              debt={activeDebt}
              mutation={repayMutation}
              onCancel={cancel}
              onClose={close}
              onSuccess={handleRepaymentSuccess}
            />
          )}
        </ScrollDialog.Content>
      </ScrollDialog.Base>
      <DeleteConfirmDialog
        open={confirmation === 'delete'}
        debtId={activeDebt._id}
        mutation={deleteMutation}
        finalFocus={actionRef}
        onCancel={() => setConfirmation(null)}
        onConfirmed={onClose}
      />
      <Dialog.Base
        open={confirmation === 'archive'}
        onOpenChange={(open, details) => {
          if (open) return;
          if (archiveMutation.isPending) details.cancel();
          else cancelArchive();
        }}
      >
        <Dialog.Content className="max-w-sm" finalFocus={actionRef}>
          <Dialog.Header><Dialog.Title>{t('debts.archive.title')}</Dialog.Title></Dialog.Header>
          <Dialog.Body>
            <Dialog.Description>{t('debts.archive.description')}</Dialog.Description>
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
              {t('debts.delete.cancel')}
            </Button.Base>
            <Button.Base
              disabled={archiveMutation.isPending}
              onClick={async () => {
                try {
                  await archiveMutation.mutateAsync(activeDebt._id);
                  onClose();
                } catch { /* Keep the confirmation and error available for an explicit retry. */ }
              }}
            >
              {archiveMutation.isPending ? t('debts.edit.saving') : t('debts.details.actions.archive')}
            </Button.Base>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </>
  );
};
