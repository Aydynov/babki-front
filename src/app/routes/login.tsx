import {
  createFileRoute,
  redirect,
  useSearch,
} from '@tanstack/react-router';
import { z } from 'zod';
import { usersQueryOptions } from '@/entities/users';
import { confirmSession, getSafeInternalRedirect } from '@/features/auth';
import { LoginPage } from '@/pages/login';
import { getAccessToken } from '@/shared/api';

const loginSearchSchema = z.object({
  redirect: z.unknown().optional().transform((value) => getSafeInternalRedirect(value) ?? undefined),
});

function LoginRoute() {
  const { redirect: redirectTo } = useSearch({ from: '/login' });
  return <LoginPage redirect={redirectTo} />;
}

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const isAuthenticated = await confirmSession(
      getAccessToken(),
      () => context.queryClient.ensureQueryData(usersQueryOptions.me()),
    );

    if (isAuthenticated) {
      redirect({ href: search.redirect ?? '/main', throw: true });
    }
  },
  component: LoginRoute,
});
