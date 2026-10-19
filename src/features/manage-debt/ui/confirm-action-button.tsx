import { type ReactNode, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';

interface ConfirmActionButtonProps {
  children: ReactNode;
  description: string;
  pending: boolean;
  disabled?: boolean;
  onConfirm: () => Promise<unknown>;
}

export const ConfirmActionButton = ({
  children, description, pending, disabled = false, onConfirm,
}: ConfirmActionButtonProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button.Base
        variant="outline"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button.Base>
      <Dialog.Base
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <Dialog.Content>
          <Dialog.Header><Dialog.Title>Подтвердите действие</Dialog.Title></Dialog.Header>
          <Dialog.Body><Dialog.Description>{description}</Dialog.Description></Dialog.Body>
          <Dialog.Footer>
            <Button.Base
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Назад
            </Button.Base>
            <Button.Base
              disabled={pending}
              onClick={async () => {
                await onConfirm().then(() => setOpen(false)).catch(() => setOpen(false));
              }}
            >
              {pending ? 'Сохранение…' : 'Подтвердить'}
            </Button.Base>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </>
  );
};
