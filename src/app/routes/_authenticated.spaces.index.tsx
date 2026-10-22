import { createFileRoute } from '@tanstack/react-router';
import { MySpacesPage } from '@/pages/spaces';

export const Route = createFileRoute('/_authenticated/spaces/')({ component: MySpacesPage });
