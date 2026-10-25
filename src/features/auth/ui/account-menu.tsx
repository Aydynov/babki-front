import { useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { LucideChevronDown, LucideLogOut, LucideShieldCheck } from 'lucide-react';
import type { User } from '@/entities/users';
import { env } from '@/shared/lib/env';
import { Button } from '@/shared/ui/button';
import { Menu } from '@/shared/ui/menu';
import { LogoutButton } from './logout-button';
import { TwoFactorManagementDialog } from './two-factor-management-dialog';

export function AccountMenu({ user, menuAnchor }: {
  user: User; menuAnchor?: RefObject<HTMLElement | null>;
}) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<'two-factor' | 'logout' | null>(null);
  const initials = `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase() || '?';
  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          ref={triggerRef}
          aria-label="Аккаунт"
          render={<Button.Base variant="ghost" className="h-11 gap-2 px-2" />}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary
            text-xs font-semibold text-primary-foreground"
          >
            {initials}
          </span>
          <span className="hidden text-sm sm:inline">Аккаунт</span>
          <LucideChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </Menu.Trigger>
        <Menu.Content
          align="end"
          anchor={menuAnchor}
          aria-label="Аккаунт"
          finalFocus={dialog ? false : triggerRef}
        >
          <div className="space-y-1 px-3 py-3">
            <p className="text-sm font-semibold wrap-anywhere">{`${user.firstName} ${user.lastName}`.trim()}</p>
            <p className="text-xs text-muted-foreground wrap-anywhere">{user.email}</p>
          </div>
          {!env.USE_LOCAL_AUTH_TOKEN && (
            <>
              <Menu.Separator />
              <Menu.Item onClick={() => setDialog('two-factor')}>
                <LucideShieldCheck aria-hidden="true" />
                {t('auth.twoFactor.management.open')}
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item className="text-destructive" onClick={() => setDialog('logout')}>
                <LucideLogOut aria-hidden="true" />
                {t('auth.logout')}
              </Menu.Item>
            </>
          )}
        </Menu.Content>
      </Menu.Root>
      <TwoFactorManagementDialog
        open={dialog === 'two-factor'}
        onOpenChange={(open) => setDialog(open ? 'two-factor' : null)}
        finalFocus={triggerRef}
      />
      <LogoutButton
        open={dialog === 'logout'}
        onOpenChange={(open) => setDialog(open ? 'logout' : null)}
        finalFocus={triggerRef}
      />
    </>
  );
}
