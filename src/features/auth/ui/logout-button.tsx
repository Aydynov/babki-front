import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LucideLogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clearAccessToken } from '@/shared/api';
import { pendingInvitation } from '@/shared/lib/pending-invitation';
import { env } from '@/shared/lib/env';
import { Button } from '@/shared/ui/button';
import { endSession } from '../model/session';

export function LogoutButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (env.USE_LOCAL_AUTH_TOKEN) {
    return null;
  }

  return (
    <Button.Base
      type="button"
      variant="outline"
      onClick={() => {
        pendingInvitation.clear();
        endSession({
          clearToken: clearAccessToken,
          clearCache: () => queryClient.clear(),
          navigateToLogin: () => router.history.replace('/login'),
        });
      }}
    >
      <LucideLogOut />
      {t('auth.logout')}
    </Button.Base>
  );
}
