import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LucideLogOut } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAccessToken } from '@/shared/api';
import { pendingInvitation } from '@/shared/lib/pending-invitation';
import { env } from '@/shared/lib/env';
import { Button } from '@/shared/ui/button';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { endSession } from '../model/session';

export function LogoutButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  if (env.USE_LOCAL_AUTH_TOKEN) {
    return null;
  }

  return (
    <>
      <Button.Base
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <LucideLogOut />
        {t('auth.logout')}
      </Button.Base>
      <AlertDialog.Base open={open} onOpenChange={setOpen}>
        <AlertDialog.Content
          className="max-w-sm"
          initialFocus={cancelRef}
          finalFocus={triggerRef}
          onBackdropClick={() => setOpen(false)}
        >
          <AlertDialog.Header>
            <AlertDialog.Title>{t('auth.logoutConfirmation.title')}</AlertDialog.Title>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <AlertDialog.Description>{t('auth.logoutConfirmation.description')}</AlertDialog.Description>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <AlertDialog.Close
              render={(
                <Button.Base
                  ref={cancelRef}
                  type="button"
                  variant="outline"
                />
              )}
            >
              {t('auth.logoutConfirmation.cancel')}
            </AlertDialog.Close>
            <Button.Base
              type="button"
              variant="destructive"
              onClick={() => {
                pendingInvitation.clear();
                endSession({
                  clearToken: clearAccessToken,
                  clearCache: () => queryClient.clear(),
                  navigateToLogin: () => router.history.replace('/login'),
                });
              }}
            >
              {t('auth.logoutConfirmation.confirm')}
            </Button.Base>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Base>
    </>
  );
}
