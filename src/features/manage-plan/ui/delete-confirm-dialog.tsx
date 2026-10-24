import { type useRemovePlanMutation } from '@/entities/plans';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import type { FC, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { getMutationErrorMessage } from '../model/errors';

interface DeleteConfirmDialogProps {
  open: boolean;
  planId: string;
  mutation: ReturnType<typeof useRemovePlanMutation>;
  finalFocus: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirmed: () => void;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
  open,
  planId,
  mutation,
  finalFocus,
  onCancel,
  onConfirmed,
}) => {
  const { t } = useTranslation();
  const mutationError = getMutationErrorMessage(mutation.error);

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    if (!next) {
      mutation.reset();
      onCancel();
    }
  };

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(planId);
      mutation.reset();
      onConfirmed();
    } catch { /* The confirmation exposes the mutation error for retry. */ }
  };

  return (
    <Dialog.Base open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content className="max-w-sm" finalFocus={finalFocus}>
        <Dialog.Header>
          <Dialog.Title>{t('plans.delete.title')}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Dialog.Description>{t('plans.delete.description')}</Dialog.Description>
          {mutationError && (
            <Typography.Caption1 className="text-destructive">{mutationError}</Typography.Caption1>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button.Base
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('plans.delete.cancel')}
          </Button.Base>
          <Button.Base
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t('plans.delete.deleting') : t('plans.delete.confirm')}
          </Button.Base>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Base>
  );
};
