import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  LucideArrowLeft, LucideArrowUpRight, LucideHome, LucidePlus, LucideSettings2, LucideUsers,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { usersQueryOptions } from '@/entities/users';
import { groupsQueryOptions } from '@/entities/groups';
import { CreateFamilyForm, GroupManagement, GroupPagination } from '@/features/manage-groups';
import { GroupInvitations } from '@/features/group-invitations';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';

function GroupsLayout({ children }: { children: ReactNode }) {
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
          to="/groups"
          className="rounded-md px-2 py-2 text-muted-foreground hover:text-foreground
          focus-visible:outline-2 focus-visible:outline-ring"
        >
          Мои группы
        </Link>
      </nav>
      {children}
    </main>
  );
}
export function MyGroupsPage() {
  const user = useQuery(usersQueryOptions.me());
  const [page, setPage] = useState(1);
  const groups = useQuery(groupsQueryOptions.list(user.data?._id ?? '', { page, limit: 20 }));
  return (
    <GroupsLayout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Мои группы</h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Общие финансы, планы и цели — в одном бюджете с близкими.
          </p>
        </div>
        <Button.Base
          nativeButton={false}
          size="lg"
          render={<Link to="/groups/new" />}
        >
          <LucidePlus aria-hidden="true" />
          {' '}
          Создать семью
        </Button.Base>
      </header>
      {groups.isPending && (
        <div
          role="status"
          aria-label="Загрузка групп"
          className="grid gap-4 sm:grid-cols-2"
        >
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}
      {groups.isError && <QueryError message="Не удалось загрузить группы" onRetry={() => groups.refetch()} />}
      {groups.data?.total === 0 && (
        <Card.Base className="items-center gap-4 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <LucideUsers className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="max-w-sm space-y-2">
            <h2 className="text-base font-semibold">Бюджет для всей семьи</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Создайте семью и пригласите близких. Вы сможете вместе вести расходы и копить на общее.
            </p>
          </div>
          <Button.Base
            nativeButton={false}
            size="lg"
            render={<Link to="/groups/new" />}
          >
            <LucidePlus aria-hidden="true" />
            {' '}
            Создать первую семью
          </Button.Base>
        </Card.Base>
      )}
      {Boolean(groups.data?.items.length) && (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {groups.data?.items.map((group) => (
            <Card.Base key={group.id} className="min-w-0 gap-5 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  {group.type === 'family' ? <LucideHome className="size-5" /> : <LucideUsers className="size-5" />}
                </span>
                <div className="min-w-0 space-y-1">
                  <h2 className="break-words text-base font-semibold">{group.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {group.type === 'family' ? 'Семейный бюджет' : 'Бюджет организации'}
                  </p>
                </div>
              </div>
              {group.description && <p className="line-clamp-2 text-sm text-muted-foreground">{group.description}</p>}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {group.role === 'owner' ? 'Владелец' : 'Участник'}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button.Base
                    nativeButton={false}
                    variant="ghost"
                    aria-label={`Настройки: ${group.name}`}
                    render={<Link to="/groups/$groupId" params={{ groupId: group.id }} />}
                  >
                    <LucideSettings2 aria-hidden="true" />
                    {' '}
                    Настройки
                  </Button.Base>
                  <Button.Base
                    nativeButton={false}
                    variant="outline"
                    render={<Link to="/main" search={{ budget: group.id }} />}
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
      {groups.data && groups.data.total > 20 && (
        <GroupPagination
          page={page}
          total={groups.data.total}
          onPage={setPage}
        />
      )}
    </GroupsLayout>
  );
}
export function CreateGroupPage() {
  const user = useQuery(usersQueryOptions.me());
  return (
    <GroupsLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Создать семью</h1>
        <p className="text-sm text-muted-foreground">Первый шаг к общим финансам.</p>
      </header>
      <div className="grid items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <Card.Base className="p-5 sm:p-7">
          {user.data && <CreateFamilyForm userId={user.data._id} />}
        </Card.Base>
        <aside className="space-y-5 px-2 py-3 text-sm">
          <h2 className="font-semibold">Как это работает</h2>
          {[
            ['Создайте общий бюджет', 'Личные счета и история останутся в личном бюджете.'],
            ['Добавьте семейные счета', 'Укажите начальные остатки и начните учёт с удобной даты.'],
            ['Пригласите близких', 'Дайте супругу или супруге полное управление финансами.'],
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
    </GroupsLayout>
  );
}
export function GroupSettingsPage({ groupId, invitationPanel }: { groupId: string; invitationPanel?: ReactNode }) {
  const user = useQuery(usersQueryOptions.me());
  const group = useQuery(groupsQueryOptions.detail(user.data?._id ?? '', groupId));
  return (
    <GroupsLayout>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Настройки общего бюджета</p>
          <h1 className="break-words text-2xl font-semibold tracking-tight">
            {group.data?.name ?? 'Настройки группы'}
          </h1>
        </div>
        {group.data && (
          <Button.Base
            nativeButton={false}
            variant="outline"
            size="lg"
            render={<Link to="/main" search={{ budget: groupId }} />}
          >
            Открыть бюджет
            {' '}
            <LucideArrowUpRight aria-hidden="true" />
          </Button.Base>
        )}
      </header>
      {group.isPending && (
      <div role="status" aria-label="Загрузка настроек"><Skeleton className="h-64 rounded-xl" /></div>
      )}
      {group.isError && (
        <QueryError message="Не удалось открыть группу. Она может быть недоступна." onRetry={() => group.refetch()} />
      )}
      {group.data && user.data && (
        <GroupManagement
          key={groupId}
          userId={user.data._id}
          group={group.data}
          invitationPanel={group.data.role === 'owner' ? (invitationPanel ?? <GroupInvitations groupId={groupId} />)
            : undefined}
        />
      )}
    </GroupsLayout>
  );
}
