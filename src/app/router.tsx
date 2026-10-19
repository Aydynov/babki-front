import { captureInvitationFragment, pendingInvitation } from '@/shared/lib/pending-invitation';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { endSession } from '@/features/auth';
import {
  clearAccessToken,
  setUnauthorizedSessionHandler,
} from '@/shared/api';
import { queryClient } from '@/shared/lib/query-client';
import { parseBudgetSearch } from '@/shared/lib/budget-scope';
import { routeTree } from '@/routeTree.gen';

export interface AppRouterContext {
  queryClient: QueryClient;
}

if (window.location.pathname === '/join') captureInvitationFragment();
// Restore the original tab-local expiry even when authentication is the initial route.
pendingInvitation.read();

const router = createRouter({
  routeTree,
  parseSearch: parseBudgetSearch,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

setUnauthorizedSessionHandler(() => {
  const { location } = router.state;
  const { pathname } = location;
  const redirect = pathname === '/login' || pathname === '/register'
    ? null
    : location.href;

  endSession({
    clearToken: clearAccessToken,
    clearCache: () => queryClient.clear(),
    navigateToLogin: (safeRedirect) => {
      router.navigate({
        to: '/login',
        search: safeRedirect ? { redirect: safeRedirect } : {},
        replace: true,
      }).catch(() => undefined);
    },
  }, redirect);
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
