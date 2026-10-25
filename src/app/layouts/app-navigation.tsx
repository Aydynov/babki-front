import { useIsMutating, useQuery } from '@tanstack/react-query';
import {
  Link, useLocation, useParams, useSearch,
} from '@tanstack/react-router';
import { LucidePlus } from 'lucide-react';
import { AppHeader } from '@/widgets/app-header';
import { spacesQueryOptions } from '@/entities/spaces';
import { usersQueryOptions } from '@/entities/users';
import { readBudgetPreference, resolveBudgetChoice } from '@/shared/lib/budget-scope';
import { Button } from '@/shared/ui/button';

export function AppNavigation() {
  const { pathname } = useLocation();
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const user = useQuery(usersQueryOptions.me());
  const userId = user.data?._id ?? '';
  const isMain = pathname === '/main';
  const isSettings = Boolean(params.spaceId);
  const spaceId = isMain
    ? resolveBudgetChoice(search.spaceId, userId ? readBudgetPreference(userId) : undefined)
    : isSettings ? resolveBudgetChoice(params.spaceId) : '';
  const space = useQuery({
    ...spacesQueryOptions.detail(userId, spaceId),
    enabled: Boolean(userId && spaceId),
    retry: false,
  });
  const mutations = useIsMutating();
  if (!user.data) return null;
  const currentSpace = space.isError ? undefined : space.data;
  return (
    <AppHeader
      user={user.data}
      space={currentSpace}
      loading={Boolean(spaceId) && space.isPending}
      busy={isMain && mutations > 0}
      actions={pathname === '/spaces' || pathname === '/spaces/' ? (
        <Button.Base nativeButton={false} render={<Link to="/spaces/new" />}>
          <LucidePlus aria-hidden="true" />
          Создать пространство
        </Button.Base>
      ) : null}
    />
  );
}
