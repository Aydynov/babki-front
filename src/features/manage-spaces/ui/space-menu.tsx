import { useEffect, useState, type RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  LucideArrowLeftRight, LucideCheck, LucideChevronDown, LucideChevronLeft, LucideChevronRight,
  LucideLayers, LucidePlus, LucideSettings2, LucideTicket, LucideUserPlus, LucideUsers,
} from 'lucide-react';
import { spacesQueryOptions, type Space } from '@/entities/spaces';
import { Button } from '@/shared/ui/button';
import { Menu } from '@/shared/ui/menu';

export function SpaceMenu({
  userId, space, busy = false, loading = false, menuAnchor,
}: {
  userId: string; space?: Space; busy?: boolean; loading?: boolean; menuAnchor?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const spaces = useQuery({
    ...spacesQueryOptions.list(userId, { page, limit: 20 }),
    enabled: open && Boolean(userId),
  });
  useEffect(() => {
    if (page > 1 && spaces.data && spaces.data.items.length === 0) setPage(1);
  }, [page, spaces.data]);
  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        render={<Button.Base variant="ghost" className="h-11 min-w-0 max-w-full shrink gap-2.5 px-2 sm:px-3" />}
        aria-label={space ? `Пространство: ${space.name}` : 'Пространства'}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card">
          <LucideLayers aria-hidden="true" className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold">{loading ? 'Загрузка…' : space?.name ?? 'Пространства'}</span>
        <LucideChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      </Menu.Trigger>
      <Menu.Content
        aria-label="Пространства"
        className="w-80"
        anchor={menuAnchor}
      >
        {space && <p className="px-3 py-2 text-sm font-semibold wrap-anywhere">{space.name}</p>}
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger>
            <LucideArrowLeftRight aria-hidden="true" />
            <span className="flex-1">Выбрать пространство</span>
            <LucideChevronRight aria-hidden="true" />
          </Menu.SubmenuTrigger>
          <Menu.Content
            side="right"
            align="start"
            sideOffset={12}
            className="w-80"
          >
            <Menu.Group>
              {spaces.isPending && <p role="status" className="px-3 py-3 text-sm">Загрузка пространств…</p>}
              {spaces.isError && (
                <>
                  <p role="alert" className="px-3 py-2 text-sm text-muted-foreground">
                    Не удалось загрузить пространства
                  </p>
                  <Menu.Item closeOnClick={false} onClick={() => spaces.refetch()}>Повторить</Menu.Item>
                </>
              )}
              {spaces.data?.total === 0 && (
                <p className="px-3 py-3 text-sm text-muted-foreground">У вас пока нет пространств.</p>
              )}
              <Menu.RadioGroup value={space?.id ?? ''} aria-label="Выбрать пространство">
                {spaces.data?.items.map((item) => (
                  <Menu.RadioItem
                    key={item.id}
                    value={item.id}
                    label={item.name}
                    disabled={busy}
                    onClick={() => {
                      navigate({ to: '/main', search: { spaceId: item.id } }).catch(() => undefined);
                    }}
                  >
                    <span className="min-w-0 flex-1 wrap-anywhere">{item.name}</span>
                    <Menu.RadioItemIndicator><LucideCheck aria-hidden="true" /></Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
              {spaces.data && spaces.data.total > 20 && (
                <>
                  <Menu.Item
                    disabled={page === 1}
                    closeOnClick={false}
                    onClick={() => setPage(page - 1)}
                  >
                    <LucideChevronLeft aria-hidden="true" />
                    Предыдущие пространства
                  </Menu.Item>
                  <Menu.Item
                    disabled={page * 20 >= spaces.data.total}
                    closeOnClick={false}
                    onClick={() => setPage(page + 1)}
                  >
                    <LucideChevronRight aria-hidden="true" />
                    Следующие пространства
                  </Menu.Item>
                  <p role="status" className="px-3 py-1 text-xs text-muted-foreground">{`Страница ${page}`}</p>
                </>
              )}
            </Menu.Group>
          </Menu.Content>
        </Menu.SubmenuRoot>
        <Menu.Separator />
        {space?.role === 'owner' && (
          <Menu.LinkItem
            render={(
              <Link
                to="/spaces/$spaceId"
                params={{ spaceId: space.id }}
                hash="space-invitations"
              />
            )}
          >
            <LucideUserPlus aria-hidden="true" />
            Пригласить близких
          </Menu.LinkItem>
        )}
        {space && (
          <Menu.LinkItem render={<Link to="/spaces/$spaceId" params={{ spaceId: space.id }} />}>
            <LucideSettings2 aria-hidden="true" />
            Настройки пространства
          </Menu.LinkItem>
        )}
        <Menu.LinkItem render={<Link to="/spaces" />}>
          <LucideUsers aria-hidden="true" />
          Все пространства
        </Menu.LinkItem>
        <Menu.LinkItem render={<Link to="/spaces/new" />}>
          <LucidePlus aria-hidden="true" />
          Создать пространство
        </Menu.LinkItem>
        <Menu.LinkItem render={<Link to="/join" />}>
          <LucideTicket aria-hidden="true" />
          Присоединиться по приглашению
        </Menu.LinkItem>
      </Menu.Content>
    </Menu.Root>
  );
}
