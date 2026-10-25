import {
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';
import { usersQueryOptions } from '@/entities/users';
import { confirmSession } from '@/features/auth';
import { getAccessToken } from '@/shared/api';
import { AppNavigation } from '../layouts/app-navigation';
import { NavigationError } from '../layouts/navigation-error';

function AuthenticatedLayout() {
  return (
    <>
      <AppNavigation />
      <Outlet />
    </>
  );
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const isAuthenticated = await confirmSession(
      getAccessToken(),
      () => context.queryClient.ensureQueryData(usersQueryOptions.me()),
    );

    if (!isAuthenticated) {
      redirect({
        to: '/login',
        search: { redirect: location.href },
        replace: true,
        throw: true,
      });
    }
  },
  component: AuthenticatedLayout,
  errorComponent: NavigationError,
});
