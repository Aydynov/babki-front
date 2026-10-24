import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Typography } from '@/shared/ui/typography';
import type { FC, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

interface CategoryConfirmDialogProps {
  action: 'archive' | 'delete';
  finalFocus: RefObject<HTMLButtonElement | null>;
  open: boolean;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const CategoryConfirmDialog: FC<CategoryConfirmDialogProps> = ({
  action,
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
      // The mutation keeps its error so the confirmation can explain the failure.
    }
  };

  return (
    <AlertDialog.Base open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Content className="max-w-sm" finalFocus={finalFocus}>
        <AlertDialog.Header>
          <AlertDialog.Title>
            {t(action === 'archive'
              ? 'expenseCategories.management.archiveConfirmation.title'
              : 'expenseCategories.management.delete.title')}
          </AlertDialog.Title>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <AlertDialog.Description>
            {t(action === 'archive'
              ? 'expenseCategories.management.archiveConfirmation.description'
              : 'expenseCategories.management.delete.description')}
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
            {t('expenseCategories.management.delete.cancel')}
          </AlertDialog.Close>
          <Button.Base
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending
              ? t(action === 'archive'
                ? 'expenseCategories.management.archiveConfirmation.pending'
                : 'expenseCategories.management.delete.deleting')
              : t(action === 'archive'
                ? 'expenseCategories.management.archive' : 'expenseCategories.management.delete.confirm')}
          </Button.Base>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Base>
  );
};
