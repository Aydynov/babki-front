import { createFileRoute } from '@tanstack/react-router';
import { CreateSpacePage } from '@/pages/spaces';

export const Route = createFileRoute('/_authenticated/spaces/new')({ component: CreateSpacePage });
