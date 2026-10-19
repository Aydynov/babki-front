import { createFileRoute } from '@tanstack/react-router';
import { MyGroupsPage } from '@/pages/groups';

export const Route = createFileRoute('/_authenticated/groups/')({ component: MyGroupsPage });
