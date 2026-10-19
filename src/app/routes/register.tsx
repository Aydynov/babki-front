import { createFileRoute, redirect, useSearch } from '@tanstack/react-router';
import { z } from 'zod';
import { usersQueryOptions } from '@/entities/users';
import { confirmSession, getSafeInternalRedirect } from '@/features/auth';
import { RegisterPage } from '@/pages/register';
import { getAccessToken } from '@/shared/api';

function RegisterRoute() {
  const search = useSearch({ from: '/register' });
  return <RegisterPage redirect={search.redirect} />;
}

export const Route = createFileRoute('/register')({
  validateSearch: z.object({
    redirect: z.unknown().optional().transform((value) => getSafeInternalRedirect(value) ?? undefined),
  }),
  beforeLoad: async ({ context, search }) => {
    const isAuthenticated = await confirmSession(
      getAccessToken(),
      () => context.queryClient.ensureQueryData(usersQueryOptions.me()),
    );
    if (isAuthenticated) redirect({ href: search.redirect ?? '/main', throw: true });
  },
  component: RegisterRoute,
});
