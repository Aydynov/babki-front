import { useEffect, useState, type ReactNode } from 'react';
import {
  LucideCheck, LucideChevronDown, LucideChevronLeft, LucideChevronRight, LucideHome,
  LucidePlus, LucideSettings2, LucideShieldCheck, LucideUsers, LucideWallet,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import {
  createSpaceSchema, spacesApi, spacesQueryOptions, useRefreshSpaces,
  spaceSchema, applySpaceResponse, applySpacePermissions,
} from '@/entities/spaces';
import type { Space, SpaceMember, SpacePermissions } from '@/entities/spaces';
import { usersQueryKeys } from '@/entities/users';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog } from '@/shared/ui/dialog';
import { Card } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';

export function SpacePagination({ page, total, onPage }: {
  page: number; total: number; onPage: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Страницы пространств"
      className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
    >
      <Button.Base
        variant="outline"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <LucideChevronLeft aria-hidden="true" />
        {' '}
        Назад
      </Button.Base>
      <span>{`Страница ${page}`}</span>
      <Button.Base
        variant="outline"
        disabled={page * 20 >= total}
        onClick={() => onPage(page + 1)}
      >
        Далее
        {' '}
        <LucideChevronRight aria-hidden="true" />
      </Button.Base>
    </nav>
  );
}
export function BudgetSelector({
  userId, currentSpaceId, onSelect, onCreate, disabled = false,
}: {
  userId: string; currentSpaceId?: string; onSelect: (id: string) => void; onCreate?: () => void; disabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const spaces = useQuery(spacesQueryOptions.list(userId, { page, limit: 20 }));
  useEffect(() => {
    if (page > 1 && spaces.data && spaces.data.total > 0 && spaces.data.items.length === 0) setPage(1);
  }, [page, spaces.data]);
  const selected = useQuery({
    ...spacesQueryOptions.detail(userId, currentSpaceId ?? ''),
    enabled: Boolean(userId && currentSpaceId),
  });
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex">
          {currentSpaceId
            ? <LucideHome className="size-5" aria-hidden="true" />
            : <LucideWallet className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 sm:max-w-80">
          <span
            id="budget-selector-label"
            className="block px-2 text-xs text-muted-foreground"
          >
            Текущий бюджет
          </span>
          <div className="relative">
            <select
              id="budget-selector"
              aria-labelledby="budget-selector-label"
              value={currentSpaceId ?? ''}
              disabled={disabled}
              className="h-9 w-full min-w-0 appearance-none truncate rounded-md bg-card pr-8 pl-2 text-sm font-semibold
                outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring
                disabled:cursor-wait disabled:opacity-50"
              onChange={(event) => onSelect(event.target.value)}
            >
              <option value="" disabled>Выберите пространство</option>
              {currentSpaceId && !spaces.data?.items.some((space) => space.id === currentSpaceId) && (
                <option value={currentSpaceId}>{selected.data?.name ?? 'Выбранная пространство'}</option>
              )}
              {spaces.data?.items.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
            </select>
            <LucideChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-2.5 right-2 size-4
              text-muted-foreground"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {currentSpaceId && (
          <Button.Base
            nativeButton={false}
            variant="ghost"
            render={<Link to="/spaces/$spaceId" params={{ spaceId: currentSpaceId }} />}
          >
            <LucideSettings2 aria-hidden="true" />
            {' '}
            <span className="hidden sm:inline">Настройки</span>
            <span className="sr-only sm:hidden">Настройки пространства</span>
          </Button.Base>
        )}
        <Button.Base
          nativeButton={false}
          variant="ghost"
          render={<Link to="/spaces" />}
        >
          <LucideUsers aria-hidden="true" />
          {' '}
          Мои пространства
        </Button.Base>
        {onCreate ? (
          <Button.Base variant="outline" onClick={onCreate}>
            <LucidePlus aria-hidden="true" />
            {' '}
            Создать пространство
          </Button.Base>
        ) : (
          <Button.Base
            nativeButton={false}
            variant="outline"
            render={<Link to="/spaces/new" />}
          >
            <LucidePlus aria-hidden="true" />
            {' '}
            Создать пространство
          </Button.Base>
        )}
      </div>
      {spaces.data?.total === 0 && (
        <p className="w-full text-sm text-muted-foreground">
          У вас пока нет пространств. Создайте первое или откройте ссылку приглашения.
        </p>
      )}
      {spaces.isPending && <span role="status" className="text-xs text-muted-foreground">Загрузка пространств…</span>}
      {spaces.isError && (
        <div className="w-full border-t pt-3">
          <QueryError
            compact
            message="Не удалось загрузить пространства"
            onRetry={() => spaces.refetch()}
          />
        </div>
      )}
      {spaces.data && spaces.data.total > 20 && (
        <div className="w-full border-t pt-3">
          <SpacePagination
            page={page}
            total={spaces.data.total}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
export function CreateSpaceForm({ userId }: { userId: string }) {
  const [name, setName] = useState('');
  const [invalid, setInvalid] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const refresh = useRefreshSpaces(userId);
  const create = useMutation({
    mutationFn: () => spacesApi.create({ name }),
    onSuccess: async (space) => {
      await refresh().catch(() => undefined);
      if (client.getQueryData<{ _id: string }>(usersQueryKeys.me())?._id === userId
        && window.location.pathname === '/spaces/new') {
        await navigate({ to: '/main', search: { spaceId: space.id } });
      }
    },
    retry: false,
  });
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const valid = createSpaceSchema.safeParse({ name }).success;
        setInvalid(!valid);
        if (valid && !create.isPending) create.mutate();
      }}
    >
      <div>
        <Input.Label htmlFor="space-name">Название пространства</Input.Label>
        <Input.Base
          id="space-name"
          placeholder="Например, Семья Ивановых"
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby="space-name-hint"
          hasError={invalid}
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />
        <p id="space-name-hint" className="mt-2 text-xs text-muted-foreground">
          Название можно изменить в настройках.
        </p>
        {invalid && <Input.Error role="alert">Введите название от 1 до 100 символов.</Input.Error>}
      </div>
      {create.isError && (
        <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          Не удалось создать пространство. Название сохранено, попробуйте ещё раз.
        </p>
      )}
      <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
        <LucideHome className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          После создания добавьте первый счёт и пригласите близких. Эти шаги можно пропустить.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button.Base
          nativeButton={false}
          variant="ghost"
          render={<Link to="/spaces" />}
        >
          Отмена
        </Button.Base>
        <Button.Base
          size="lg"
          type="submit"
          disabled={create.isPending}
        >
          <LucidePlus aria-hidden="true" />
          {' '}
          {create.isPending ? 'Создаём пространство…' : 'Создать пространство'}
        </Button.Base>
      </div>
    </form>
  );
}
const permissionLabels: Record<keyof SpacePermissions, string> = {
  manageAccounts: 'Управление счетами',
  manageCategories: 'Управление категориями',
  manageLimits: 'Управление лимитами',
  manageTransactions: 'Управление операциями',
};
const allPermissions: SpacePermissions = {
  manageAccounts: true, manageCategories: true, manageLimits: true, manageTransactions: true,
};
interface Confirmation { title: string; description: string; run: () => Promise<unknown>; exit?: boolean }
export function SpaceManagement({ userId, space, invitationPanel }: {
  userId: string; space: Space; invitationPanel?: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? '');
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [message, setMessage] = useState('');
  const members = useQuery(spacesQueryOptions.members(userId, space.id, { page, limit: 20 }));
  const refresh = useRefreshSpaces(userId);
  const navigate = useNavigate();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async (response) => {
      const saved = spaceSchema.safeParse(response);
      if (saved.success && saved.data.id === space.id) applySpaceResponse(client, userId, saved.data);
      await refresh().catch(() => undefined);
      setMessage('Изменения сохранены.');
    },
    onError: async (error) => {
      setMessage(isAxiosError(error) && error.response?.status === 403
        ? 'Права изменились. Сведения обновлены, проверьте доступные действия.'
        : 'Не удалось сохранить изменения. Повторите действие.');
      await refresh();
    },
    retry: false,
  });
  const confirm = (action: Confirmation) => {
    setMessage('');
    setConfirmation(action);
  };
  const act = (action: () => Promise<unknown>) => {
    setMessage('');
    mutation.mutate(action);
  };
  const updatePermissions = (memberId: string, payload: Partial<SpacePermissions>) => act(async () => {
    const permissions = await spacesApi.permissions(space.id, memberId, payload);
    applySpacePermissions(client, userId, space.id, memberId, permissions);
    return permissions;
  });
  const memberName = (member: SpaceMember) => (
    [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Участник'
  );
  return (
    <div className="flex min-w-0 flex-col gap-5">
      {message && (
        <p role="status" className={`rounded-lg border p-3 text-sm ${mutation.isError ? 'text-destructive' : ''}`}>
          {message}
        </p>
      )}
      <div className="grid min-w-0 items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <Card.Base className="min-w-0 gap-5 p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">О пространстве</h2>
            <p className="text-sm text-muted-foreground">Название и описание вашего общего бюджета.</p>
          </div>
          {space.role === 'owner' ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                act(() => spacesApi.update(space.id, { name, description }));
              }}
            >
              <div>
                <Input.Label htmlFor="space-name">Название</Input.Label>
                <Input.Base
                  id="space-name"
                  required
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Input.Label htmlFor="space-description">
                  Описание
                  <span className="text-muted-foreground">· необязательно</span>
                </Input.Label>
                <textarea
                  id="space-description"
                  rows={3}
                  className="w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none
                    placeholder:text-muted-foreground focus-visible:border-ring
                    focus-visible:ring-3 focus-visible:ring-ring/30"
                  placeholder="Например, копим на дом и планируем общие расходы"
                  value={description}
                  maxLength={1000}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end border-t pt-4">
                <Button.Base
                  size="lg"
                  type="submit"
                  disabled={mutation.isPending || !name.trim()}
                >
                  Сохранить изменения
                </Button.Base>
              </div>
            </form>
          ) : (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {space.description || 'Описание пока не добавлено.'}
            </p>
          )}
        </Card.Base>
        <Card.Base className="gap-4 p-5 sm:p-6" aria-label="Ваши финансовые права">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <LucideShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Ваш доступ</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {space.role === 'owner' ? 'Вы — владелец' : 'Вы — участник'}
              </p>
            </div>
          </div>
          <div className="space-y-3 border-t pt-4">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="flex shrink-0 items-center gap-1 font-medium">
                  {space.permissions[key as keyof SpacePermissions] && (
                  <LucideCheck
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  )}
                  {space.permissions[key as keyof SpacePermissions] ? 'Разрешено' : 'Нет доступа'}
                </span>
              </div>
            ))}
          </div>
          {space.role !== 'owner' && (
            <p className="text-xs leading-relaxed text-muted-foreground">Изменить права может владелец пространства.</p>
          )}
        </Card.Base>
      </div>
      <div className="grid min-w-0 items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <Card.Base className="min-w-0 gap-5 p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Участники
              {members.data && (
              <span
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {members.data.total}
              </span>
              )}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {space.role === 'owner'
                ? 'Выберите, кто может управлять финансами пространства.'
                : 'Все участники видят общий бюджет.'}
            </p>
          </div>
          {members.isPending && (
          <div role="status" aria-label="Загрузка участников"><Skeleton className="h-40" /></div>
          )}
          {members.isError && (
            <QueryError message="Не удалось загрузить участников" onRetry={() => members.refetch()} />
          )}
          {members.data?.items.map((member) => (
            <section key={member.userId} className="min-w-0 rounded-xl border">
              <div className="flex items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted
                  text-sm font-medium"
                >
                  {memberName(member).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold">
                    {memberName(member)}
                    {' '}
                    {member.userId === userId && <span className="font-normal text-muted-foreground">· вы</span>}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.role === 'owner' ? 'Владелец' : 'Участник'}
                  </p>
                </div>
                {member.role === 'owner' && (
                <LucideShieldCheck
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                )}
              </div>
              {member.role === 'owner' ? (
                <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                  Полное управление бюджетом и участниками.
                </p>
              ) : (
                <div className="grid gap-x-5 border-t px-4 py-1 sm:grid-cols-2">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <label
                      key={key}
                      htmlFor={`${member.userId}-${key}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-2 text-xs"
                    >
                      <span>{label}</span>
                      <Switch
                        id={`${member.userId}-${key}`}
                        checked={member.permissions[key as keyof SpacePermissions]}
                        disabled={space.role !== 'owner' || mutation.isPending}
                        onCheckedChange={(checked) => updatePermissions(member.userId, { [key]: checked })}
                      />
                    </label>
                  ))}
                </div>
              )}
              {space.role === 'owner' && member.role !== 'owner' && (
                <div className="flex flex-col items-start gap-3 border-t p-4">
                  <Button.Base
                    variant="outline"
                    className="h-auto min-h-9 whitespace-normal text-left"
                    disabled={mutation.isPending || Object.values(member.permissions).every(Boolean)}
                    onClick={() => updatePermissions(member.userId, allPermissions)}
                  >
                    <LucideShieldCheck aria-hidden="true" />
                    {Object.values(member.permissions).every(Boolean)
                      ? 'Полное управление включено'
                      : 'Дать полное управление финансами'}
                  </Button.Base>
                  <div className="flex flex-wrap gap-1">
                    <Button.Base
                      variant="ghost"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => confirm({
                        title: 'Передать владение?',
                        description: 'Вы потеряете административные полномочия. Ваши финансовые права будут сброшены.',
                        run: () => spacesApi.transferOwnership(space.id, member.userId),
                      })}
                    >
                      Передать владение
                    </Button.Base>
                    <Button.Base
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={mutation.isPending}
                      onClick={() => confirm({
                        title: 'Исключить участника?',
                        description: 'Участник потеряет доступ к пространству. История сохранится.',
                        run: () => spacesApi.removeMember(space.id, member.userId),
                      })}
                    >
                      Исключить
                    </Button.Base>
                  </div>
                </div>
              )}
            </section>
          ))}
          {members.data && members.data.total > 20 && (
            <SpacePagination
              page={page}
              total={members.data.total}
              onPage={setPage}
            />
          )}
        </Card.Base>
        {invitationPanel}
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border
        border-destructive/20 p-5 sm:p-6"
      >
        <div className="max-w-xl space-y-1">
          <h2 className="text-sm font-semibold">
            {space.role === 'owner' ? 'Удаление пространства' : 'Выход из пространства'}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {space.role === 'owner'
              ? 'Для выхода передайте владение другому участнику. При удалении все участники потеряют доступ к бюджету.'
              : 'Вы потеряете доступ к общему бюджету. Для возвращения потребуется новое приглашение.'}
          </p>
        </div>
        {space.role === 'owner' ? (
          <Button.Base
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => confirm({
              title: 'Удалить пространство?',
              description: 'Участники потеряют доступ к пространству и его истории. Восстановление недоступно.',
              run: () => spacesApi.remove(space.id),
              exit: true,
            })}
          >
            Удалить пространство
          </Button.Base>
        ) : (
          <Button.Base
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => confirm({
              title: 'Выйти из пространства?',
              description: 'Вы потеряете доступ к пространству. Для возвращения потребуется новое приглашение.',
              run: () => spacesApi.leave(space.id),
              exit: true,
            })}
          >
            Выйти из пространства
          </Button.Base>
        )}
      </section>
      <Dialog.Base
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(undefined);
        }}
      >
        <Dialog.Content>
          <Dialog.Title>{confirmation?.title}</Dialog.Title>
          <Dialog.Description>{confirmation?.description}</Dialog.Description>
          {mutation.isError && <p role="alert">{message}</p>}
          <Dialog.Footer>
            <Button.Base
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setConfirmation(undefined)}
            >
              Отмена
            </Button.Base>
            <Button.Base
              variant="destructive"
              disabled={mutation.isPending}
              onClick={async () => {
                if (!confirmation) return;
                try {
                  await mutation.mutateAsync(confirmation.run);
                  setConfirmation(undefined);
                  if (confirmation.exit
                    && client.getQueryData<{ _id: string }>(usersQueryKeys.me())?._id === userId
                    && window.location.pathname === `/spaces/${space.id}`) {
                    try {
                      window.sessionStorage.setItem('budget-notice', 'Доступ завершён. Выберите другое пространство.');
                    } catch { /* Navigation remains available when storage is blocked. */ }
                    await navigate({ to: '/main', search: {} });
                  }
                } catch { /* Keep the confirmation open so the action can be retried. */ }
              }}
            >
              Подтвердить
            </Button.Base>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </div>
  );
}
