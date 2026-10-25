import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { usersQueryOptions } from '@/entities/users';
import { confirmSession } from '@/features/auth';
import { JoinPage } from '@/pages/join';
import { getAccessToken } from '@/shared/api';
import { captureInvitationFragment, pendingInvitation } from '@/shared/lib/pending-invitation';
import { AppNavigation } from '../layouts/app-navigation';
import { NavigationError } from '../layouts/navigation-error';

function JoinRoute() {
  const { userId, invitationVersion } = useLoaderData({ from: '/join' });
  return (
    <>
      {userId && <AppNavigation />}
      <JoinPage userId={userId} invitationVersion={invitationVersion} />
    </>
  );
}

export const Route = createFileRoute('/join')({
  beforeLoad: () => {
    captureInvitationFragment();
  },
  loader: async ({ context }) => {
    const authenticated = await confirmSession(
      getAccessToken(),
      () => context.queryClient.ensureQueryData(usersQueryOptions.me()),
    );
    const user = authenticated
      ? await context.queryClient.ensureQueryData(usersQueryOptions.me())
      : null;
    return { userId: user?._id ?? null, invitationVersion: pendingInvitation.read()?.createdAt ?? 0 };
  },
  component: JoinRoute,
  errorComponent: NavigationError,
});
