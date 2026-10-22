import { useEffect, useState } from 'react';
import { LucideArrowRight, LucideUserPlus, LucideX } from 'lucide-react';
import {
  Link, useBlocker, useNavigate, useSearch,
} from '@tanstack/react-router';
import { useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BudgetProvider } from '@/entities/budgets';
import { spacesQueryOptions } from '@/entities/spaces';
import { usersQueryOptions } from '@/entities/users';
import { BudgetSelector } from '@/features/manage-spaces';
import { requestAccountManagement, accountsQueryOptions } from '@/entities/accounts';
import { SpaceInvitations } from '@/features/space-invitations';
import { readBudgetPreference, resolveBudgetChoice, saveBudgetPreference } from '@/shared/lib/budget-scope';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import type { BudgetScope } from '@/shared/types';
import { LogoutButton, TwoFactorManagementDialog } from '@/features/auth';
import { MainPage } from './main-page';

function SpaceSetup({ spaceId, scope }: { spaceId: string; scope: BudgetScope }) {
  const accounts = useQuery(accountsQueryOptions.findAll({}, scope));
  const space = useQuery(spacesQueryOptions.detail(scope.userId, spaceId));
  const [invite, setInvite] = useState(false);
  if (space.data?.role !== 'owner' || !accounts.isSuccess) return null;
  return (
    <div className="mx-(--app-inline-padding) mt-3 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">
            {accounts.data.length === 0 ? 'Начните учёт' : 'Ведите бюджет вместе'}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {accounts.data.length === 0
              ? 'Добавьте первый счёт с начальным остатком, затем пригласите близких.'
              : 'Пригласите близких и настройте совместное управление финансами.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.data.length === 0 && (
            <Button.Base onClick={requestAccountManagement}>
              Добавить счёт
              <LucideArrowRight aria-hidden="true" />
            </Button.Base>
          )}
          <Button.Base
            variant="outline"
            aria-expanded={invite}
            aria-controls="space-invitations"
            onClick={() => setInvite(!invite)}
          >
            {invite ? <LucideX aria-hidden="true" /> : <LucideUserPlus aria-hidden="true" />}
            {invite ? 'Скрыть приглашения' : 'Пригласить участников'}
          </Button.Base>
        </div>
      </div>
      {invite && <div id="space-invitations" className="mt-3 max-w-xl"><SpaceInvitations spaceId={spaceId} /></div>}
    </div>
  );
}
export function BudgetMainPage() {
  const search = useSearch({ from: '/_authenticated/main' });
  const navigate = useNavigate();
  const client = useQueryClient();
  const user = useQuery(usersQueryOptions.me());
  const userId = user.data?._id ?? '';
  const spaceId = resolveBudgetChoice(search.spaceId, userId ? readBudgetPreference(userId) : undefined);
  const space = useQuery({
    ...spacesQueryOptions.detail(userId, spaceId),
    enabled: Boolean(userId && spaceId),
    retry: false,
    refetchOnWindowFocus: true,
  });
  const [notice, setNotice] = useState('');
  const mutations = useIsMutating();
  const scope: BudgetScope = { userId, spaceId };
  const [dirtyForms] = useState(() => new Set<HTMLFormElement>());
  useEffect(() => {
    if (!userId || !spaceId || !space.isSuccess) return;
    saveBudgetPreference(userId, spaceId);
    if (search.spaceId === undefined) {
      navigate({ to: '/main', search: { spaceId }, replace: true }).catch(() => undefined);
    }
  }, [navigate, search.spaceId, space.isSuccess, spaceId, userId]);
  useEffect(() => () => {
    client.cancelQueries({ predicate: ({ queryKey }) => queryKey[1] === userId && queryKey[2] === spaceId })
      .catch(() => undefined);
  }, [client, userId, spaceId]);
  useEffect(() => {
    const mark = (event: Event) => {
      const form = (event.target as HTMLInputElement | null)?.form;
      if (form) dirtyForms.add(form);
    };
    document.addEventListener('input', mark);
    document.addEventListener('change', mark);
    return () => {
      document.removeEventListener('input', mark);
      document.removeEventListener('change', mark);
    };
  }, [dirtyForms]);
  useBlocker({
    shouldBlockFn: ({ current, next }) => {
      if (next.pathname === '/login') return false;
      if (current.pathname === next.pathname
        && JSON.stringify(current.search) === JSON.stringify(next.search)) return false;
      if (mutations > 0) return true;
      const dirty = [...dirtyForms].some((form) => form.isConnected);
      if (!dirty) return false;
      // Native confirmation also covers browser back/forward navigation.
      // eslint-disable-next-line no-alert
      if (!window.confirm('Несохранённые изменения будут потеряны. Продолжить?')) return true;
      dirtyForms.clear();
      return false;
    },
    enableBeforeUnload: () => [...dirtyForms].some((form) => form.isConnected),
  });
  useEffect(() => {
    if (!spaceId || !axios.isAxiosError(space.error)
      || ![403, 404].includes(space.error.response?.status ?? 0)) return;
    client.invalidateQueries({ queryKey: ['spaces', userId] }).catch(() => undefined);
    client.removeQueries({ predicate: ({ queryKey }) => queryKey[1] === userId && queryKey[2] === spaceId });
    saveBudgetPreference(userId, null);
    setNotice('Пространство недоступно. Выберите другое пространство.');
    navigate({
      to: '/main', search: {}, replace: true, ignoreBlocker: true,
    }).catch(() => undefined);
  }, [client, space.error, spaceId, navigate, userId]);
  useEffect(() => {
    try {
      const message = sessionStorage.getItem('budget-notice');
      if (message) {
        setNotice(message);
        sessionStorage.removeItem('budget-notice');
      }
    } catch { /* Optional notice storage. */ }
  }, []);
  useEffect(() => {
    const refresh = (event: Event) => {
      const { detail } = (event as CustomEvent<{ status: number; spaceId: string }>);
      if (detail.spaceId === spaceId && (detail.status === 403 || detail.status === 404)) {
        space.refetch().catch(() => undefined);
      }
    };
    window.addEventListener('babki:budget-access', refresh);
    return () => window.removeEventListener('babki:budget-access', refresh);
  }, [space, spaceId]);
  if (!user.data || (spaceId && space.isLoading)) {
    return <div className="p-5" aria-busy="true"><Skeleton className="h-40 w-full" /></div>;
  }
  if (spaceId && (space.isError || !space.data)) {
    return (
      <QueryError
        message="Не удалось проверить доступ к пространству"
        onRetry={() => {
          space.refetch().catch(() => undefined);
        }}
      />
    );
  }
  if (!spaceId || !space.data) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{user.data.firstName}</h1>
            <p>{user.data.email}</p>
          </div>
          <div className="flex gap-2">
            <TwoFactorManagementDialog />
            <LogoutButton />
          </div>
        </div>
        {notice && <p role="status">{notice}</p>}
        <h2 className="text-lg font-semibold">Выберите пространство</h2>
        <p>Откройте пространство или создайте новое. Для вступления откройте ссылку приглашения.</p>
        <BudgetSelector
          userId={userId}
          disabled={mutations > 0}
          onSelect={(id) => {
            navigate({ to: '/main', search: { spaceId: id } }).catch(() => undefined);
          }}
        />
        <Link to="/join" className="underline">Присоединиться по приглашению</Link>
      </main>
    );
  }
  if (search.spaceId === undefined) return <div className="p-5" aria-busy="true"><Skeleton className="h-40" /></div>;
  const title = space.data.name;
  return (
    <BudgetProvider value={{ scope, space: space.data, title }}>
      <div className="px-(--app-inline-padding) pt-4">
        {notice && <p role="status" className="mb-3 rounded-lg border p-3">{notice}</p>}
        <BudgetSelector
          userId={userId}
          currentSpaceId={spaceId || undefined}
          disabled={mutations > 0}
          onSelect={(id) => {
            navigate({ to: '/main', search: { spaceId: id } }).catch(() => undefined);
          }}
        />
      </div>
      <div key={`${userId}:${spaceId}`}>
        {spaceId && <SpaceSetup spaceId={spaceId} scope={scope} />}
        <MainPage />
      </div>
    </BudgetProvider>
  );
}
