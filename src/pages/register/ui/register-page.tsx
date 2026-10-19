import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth';
import { Typography } from '@/shared/ui/typography';
import { AuthShell } from '@/widgets/auth-shell';

export function RegisterPage({ redirect }: { redirect?: string }) {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-title-1 text-3xl">{t('auth.register.title')}</h1>
        <Typography.Body3 className="mt-2 text-muted-foreground">
          {t('auth.register.description')}
        </Typography.Body3>
      </div>
      <RegisterForm redirect={redirect} />
    </AuthShell>
  );
}
