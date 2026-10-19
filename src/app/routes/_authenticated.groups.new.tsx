import { createFileRoute } from '@tanstack/react-router';
import { CreateGroupPage } from '@/pages/groups';

export const Route = createFileRoute('/_authenticated/groups/new')({ component: CreateGroupPage });
