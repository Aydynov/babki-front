import { useRef, type ReactNode } from 'react';
import type { Space } from '@/entities/spaces';
import type { User } from '@/entities/users';
import { AccountMenu } from '@/features/auth';
import { SpaceMenu } from '@/features/manage-spaces';

export function AppHeader({
  user, space, actions, busy, loading,
}: {
  user: User; space?: Space; actions?: ReactNode; busy?: boolean; loading?: boolean;
}) {
  const menuAnchor = useRef<HTMLElement>(null);
  return (
    <header className="rounded-b-2xl border-b bg-card px-3 sm:px-5 lg:px-7">
      <nav
        ref={menuAnchor}
        aria-label="Основная навигация"
        className="grid min-h-16 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2
          sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <div className="min-w-0 justify-self-start max-w-full sm:max-w-96">
          <SpaceMenu
            menuAnchor={menuAnchor}
            userId={user._id}
            space={space}
            busy={busy}
            loading={loading}
          />
        </div>
        {actions && (
          <div className="col-span-2 row-start-2 flex flex-wrap gap-2 pt-2 pb-1
            sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:p-0 [&_a]:min-h-11 [&_button]:min-h-11"
          >
            {actions}
          </div>
        )}
        <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
          <AccountMenu user={user} menuAnchor={menuAnchor} />
        </div>
      </nav>
    </header>
  );
}
