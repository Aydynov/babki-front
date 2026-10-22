import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  LucideArrowLeft, LucideArrowUpRight, LucidePlus, LucideSettings2, LucideUsers,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { usersQueryOptions } from '@/entities/users';
import { spacesQueryOptions } from '@/entities/spaces';
import { CreateSpaceForm, SpaceManagement, SpacePagination } from '@/features/manage-spaces';
import { SpaceInvitations } from '@/features/space-invitations';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';

function SpacesLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-7 px-4 py-5 sm:px-8 sm:py-8">
      <nav aria-label="Навигация по бюджетам" className="flex flex-wrap items-center gap-2 text-sm">
        <Button.Base
          nativeButton={false}
          variant="ghost"
          render={<Link to="/main" />}
        >
          <LucideArrowLeft aria-hidden="true" />
          {' '}
          К бюджету
        </Button.Base>
        <span aria-hidden="true" className="text-border">/</span>
        <Link
          to="/spaces"
          className="rounded-md px-2 py-2 text-muted-foreground hover:text-foreground
          focus-visible:outline-2 focus-visible:outline-ring"
        >
          Мои пространства
        </Link>
      </nav>
      {children}
    </main>
  );
}
export function MySpacesPage() {
  const user = useQuery(usersQueryOptions.me());
  const [page, setPage] = useState(1);
  const spaces = useQuery(spacesQueryOptions.list(user.data?._id ?? '', { page, limit: 20 }));
  useEffect(() => {
    if (page > 1 && spaces.data && spaces.data.total > 0 && spaces.data.items.length === 0) setPage(1);
  }, [page, spaces.data]);
  return (
    <SpacesLayout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Мои пространства</h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Общие финансы, планы и цели — в одном бюджете с близкими.
          </p>
        </div>
        <Button.Base
          nativeButton={false}
          size="lg"
          render={<Link to="/spaces/new" />}
        >
          <LucidePlus aria-hidden="true" />
          {' '}
          Создать пространство
        </Button.Base>
      </header>
      {spaces.isPending && (
        <div
          role="status"
          aria-label="Загрузка пространств"
          className="grid gap-4 sm:grid-cols-2"
        >
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}
      {spaces.isError && <QueryError message="Не удалось загрузить пространства" onRetry={() => spaces.refetch()} />}
      {spaces.data?.total === 0 && (
        <Card.Base className="items-center gap-4 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <LucideUsers className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="max-w-sm space-y-2">
            <h2 className="text-base font-semibold">Ваше первое пространство</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Создайте пространство и пригласите близких. Вы сможете вместе вести расходы и копить на общее.
            </p>
          </div>
          <Button.Base
            nativeButton={false}
            size="lg"
            render={<Link to="/spaces/new" />}
          >
            <LucidePlus aria-hidden="true" />
            {' '}
            Создать первое пространство
          </Button.Base>
        </Card.Base>
      )}
      {Boolean(spaces.data?.items.length) && (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {spaces.data?.items.map((space) => (
            <Card.Base key={space.id} className="min-w-0 gap-5 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <LucideUsers className="size-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h2 className="break-words text-base font-semibold">{space.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Пространство
                  </p>
                </div>
              </div>
              {space.description && <p className="line-clamp-2 text-sm text-muted-foreground">{space.description}</p>}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {space.role === 'owner' ? 'Владелец' : 'Участник'}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button.Base
                    nativeButton={false}
                    variant="ghost"
                    aria-label={`Настройки: ${space.name}`}
                    render={<Link to="/spaces/$spaceId" params={{ spaceId: space.id }} />}
                  >
                    <LucideSettings2 aria-hidden="true" />
                    {' '}
                    Настройки
                  </Button.Base>
                  <Button.Base
                    nativeButton={false}
                    variant="outline"
                    render={<Link to="/main" search={{ spaceId: space.id }} />}
                  >
                    Открыть бюджет
                    {' '}
                    <LucideArrowUpRight aria-hidden="true" />
                  </Button.Base>
                </div>
              </div>
            </Card.Base>
          ))}
        </div>
      )}
      {spaces.data && spaces.data.total > 20 && (
        <SpacePagination
          page={page}
          total={spaces.data.total}
          onPage={setPage}
        />
      )}
    </SpacesLayout>
  );
}
export function CreateSpacePage() {
  const user = useQuery(usersQueryOptions.me());
  return (
    <SpacesLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Создать пространство</h1>
        <p className="text-sm text-muted-foreground">Первый шаг к общим финансам.</p>
      </header>
      <div className="grid items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <Card.Base className="p-5 sm:p-7">
          {user.data && <CreateSpaceForm userId={user.data._id} />}
        </Card.Base>
        <aside className="space-y-5 px-2 py-3 text-sm">
          <h2 className="font-semibold">Как это работает</h2>
          {[
            ['Создайте общий бюджет', 'Каждое пространство хранит собственные счета и историю.'],
            ['Добавьте счета', 'Укажите начальные остатки и начните учёт с удобной даты.'],
            ['Пригласите близких', 'Настройте права участников пространства.'],
          ].map(([title, description], index) => (
            <div key={title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card
                text-xs font-medium"
              >
                {index + 1}
              </span>
              <div className="space-y-1">
                <h3 className="font-medium">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </SpacesLayout>
  );
}
export function SpaceSettingsPage({ spaceId, invitationPanel }: { spaceId: string; invitationPanel?: ReactNode }) {
  const user = useQuery(usersQueryOptions.me());
  const space = useQuery(spacesQueryOptions.detail(user.data?._id ?? '', spaceId));
  return (
    <SpacesLayout>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Настройки общего бюджета</p>
          <h1 className="break-words text-2xl font-semibold tracking-tight">
            {space.data?.name ?? 'Настройки пространства'}
          </h1>
        </div>
        {space.data && (
          <Button.Base
            nativeButton={false}
            variant="outline"
            size="lg"
            render={<Link to="/main" search={{ spaceId }} />}
          >
            Открыть бюджет
            {' '}
            <LucideArrowUpRight aria-hidden="true" />
          </Button.Base>
        )}
      </header>
      {space.isPending && (
      <div role="status" aria-label="Загрузка настроек"><Skeleton className="h-64 rounded-xl" /></div>
      )}
      {space.isError && (
        <QueryError
          message="Не удалось открыть пространство. Оно может быть недоступно."
          onRetry={() => space.refetch()}
        />
      )}
      {space.data && user.data && (
        <SpaceManagement
          key={spaceId}
          userId={user.data._id}
          space={space.data}
          invitationPanel={space.data.role === 'owner' ? (invitationPanel ?? <SpaceInvitations spaceId={spaceId} />)
            : undefined}
        />
      )}
    </SpacesLayout>
  );
}
