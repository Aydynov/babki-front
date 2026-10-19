import { createFileRoute, useParams } from '@tanstack/react-router';
import { GroupSettingsPage } from '@/pages/groups';

function GroupSettingsRoute() {
  const { groupId } = useParams({ from: '/_authenticated/groups/$groupId' });
  return <GroupSettingsPage groupId={groupId} />;
}

export const Route = createFileRoute('/_authenticated/groups/$groupId')({ component: GroupSettingsRoute });
