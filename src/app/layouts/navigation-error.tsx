import { useQuery } from '@tanstack/react-query';
import { usersQueryOptions } from '@/entities/users';
import { getAccessToken } from '@/shared/api';
import { QueryError } from '@/shared/ui/query-error';
import { AppNavigation } from './app-navigation';

export function NavigationError() {
  const user = useQuery({ ...usersQueryOptions.me(), enabled: false });
  return (
    <>
      {user.data && getAccessToken() && <AppNavigation />}
      <main className="px-4 py-8">
        <QueryError message="Не удалось открыть страницу" onRetry={() => window.location.reload()} />
      </main>
    </>
  );
}
