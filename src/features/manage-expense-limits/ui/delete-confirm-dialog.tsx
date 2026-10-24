import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Typography } from '@/shared/ui/typography';
import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmDialogProps {
  finalFocus?: ComponentProps<typeof AlertDialog.Content>['finalFocus'];
  open: boolean;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
  finalFocus,
  open,
  pending,
  error,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const handleOpenChange = (nextOpen: boolean) => {
    if (pending || nextOpen) return;
    onCancel();
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      // Keep the mutation error visible so the user can retry or cancel.
    }
  };

  return (
    <AlertDialog.Base open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Content className="max-w-sm" finalFocus={finalFocus}>
        <AlertDialog.Header>
          <AlertDialog.Title>{t('expenseLimits.management.delete.title')}</AlertDialog.Title>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <AlertDialog.Description>
            {t('expenseLimits.management.delete.description')}
          </AlertDialog.Description>
          {error && (
            <Typography.Caption1 className="text-destructive" role="alert">
              {error}
            </Typography.Caption1>
          )}
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <AlertDialog.Close
            render={(
              <Button.Base
                type="button"
                variant="outline"
                disabled={pending}
              />
            )}
          >
            {t('expenseLimits.management.delete.cancel')}
          </AlertDialog.Close>
          <Button.Base
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending
              ? t('expenseLimits.management.delete.deleting')
              : t('expenseLimits.management.delete.confirm')}
          </Button.Base>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Base>
  );
};
