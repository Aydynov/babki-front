import { createFileRoute, useParams } from '@tanstack/react-router';
import { SpaceSettingsPage } from '@/pages/spaces';

function SpaceSettingsRoute() {
  const { spaceId } = useParams({ from: '/_authenticated/spaces/$spaceId' });
  return <SpaceSettingsPage spaceId={spaceId} />;
}

export const Route = createFileRoute('/_authenticated/spaces/$spaceId')({ component: SpaceSettingsRoute });
