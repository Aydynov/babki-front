import { useEffect, useState } from 'react';
import { LucideArrowRight, LucideUserPlus, LucideX } from 'lucide-react';
import { useBlocker, useNavigate, useSearch } from '@tanstack/react-router';
import { useIsMutating, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BudgetProvider } from '@/entities/budgets';
import { groupsQueryOptions } from '@/entities/groups';
import { usersQueryOptions } from '@/entities/users';
import { BudgetSelector } from '@/features/manage-groups';
import { requestAccountManagement, accountsQueryOptions } from '@/entities/accounts';
import { GroupInvitations } from '@/features/group-invitations';
import { readBudgetPreference, resolveBudgetChoice, saveBudgetPreference } from '@/shared/lib/budget-scope';
import { QueryError } from '@/shared/ui/query-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import type { BudgetScope } from '@/shared/types';
import { MainPage } from './main-page';

function FamilySetup({ groupId, scope }: { groupId: string; scope: BudgetScope }) {
  const accounts = useQuery(accountsQueryOptions.findAll({}, scope));
  const group = useQuery(groupsQueryOptions.detail(scope.userId, groupId));
  const [invite, setInvite] = useState(false);
  if (group.data?.role !== 'owner' || !accounts.isSuccess) return null;
  return (
    <div className="mx-(--app-inline-padding) mt-3 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">
            {accounts.data.length === 0 ? 'Начните семейный учёт' : 'Ведите бюджет вместе'}
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
            aria-controls="family-invitations"
            onClick={() => setInvite(!invite)}
          >
            {invite ? <LucideX aria-hidden="true" /> : <LucideUserPlus aria-hidden="true" />}
            {invite ? 'Скрыть приглашения' : 'Пригласить в семью'}
          </Button.Base>
        </div>
      </div>
      {invite && <div id="family-invitations" className="mt-3 max-w-xl"><GroupInvitations groupId={groupId} /></div>}
    </div>
  );
}
export function BudgetMainPage() {
  const search = useSearch({ from: '/_authenticated/main' });
  const navigate = useNavigate();
  const client = useQueryClient();
  const user = useQuery(usersQueryOptions.me());
  const userId = user.data?._id ?? '';
  const choice = resolveBudgetChoice(search.budget, userId ? readBudgetPreference(userId) : undefined);
  const groupId = choice === 'personal' ? '' : choice;
  const group = useQuery({
    ...groupsQueryOptions.detail(userId, groupId),
    enabled: Boolean(userId && groupId),
    retry: false,
    refetchOnWindowFocus: true,
  });
  const [notice, setNotice] = useState('');
  const mutations = useIsMutating();
  const scope: BudgetScope = groupId ? { kind: 'group', userId, groupId } : { kind: 'personal', userId };
  const [dirtyForms] = useState(() => new Set<HTMLFormElement>());
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
    if (!userId) return;
    if (search.budget !== choice) {
      navigate({ to: '/main', search: { budget: choice }, replace: true }).catch(() => undefined);
    }
    if (!groupId || group.isSuccess) saveBudgetPreference(userId, choice);
  }, [choice, group.isSuccess, groupId, navigate, search.budget, userId]);
  useEffect(() => {
    if (!groupId || !axios.isAxiosError(group.error) || group.error.response?.status !== 404) return;
    client.removeQueries({ predicate: ({ queryKey }) => queryKey[1] === userId && queryKey[3] === groupId });
    saveBudgetPreference(userId, 'personal');
    setNotice('Группа недоступна. Открыт личный бюджет.');
    navigate({
      to: '/main', search: { budget: 'personal' }, replace: true, ignoreBlocker: true,
    }).catch(() => undefined);
  }, [client, group.error, groupId, navigate, userId]);
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
      const { detail } = (event as CustomEvent<{ status: number; groupId: string }>);
      if (detail.groupId === groupId && (detail.status === 403 || detail.status === 404)) {
        group.refetch().catch(() => undefined);
      }
    };
    window.addEventListener('babki:budget-access', refresh);
    return () => window.removeEventListener('babki:budget-access', refresh);
  }, [group, groupId]);
  if (!user.data || (groupId && group.isLoading)) {
    return <div className="p-5" aria-busy="true"><Skeleton className="h-40 w-full" /></div>;
  }
  if (groupId && (group.isError || !group.data)) {
    return (
      <QueryError
        message="Не удалось проверить доступ к группе"
        onRetry={() => {
          group.refetch().catch(() => undefined);
        }}
      />
    );
  }
  const title = group.data?.name ?? 'Личный бюджет';
  return (
    <BudgetProvider value={{ scope, group: groupId ? group.data : undefined, title }}>
      <div className="px-(--app-inline-padding) pt-4">
        {notice && <p role="status" className="mb-3 rounded-lg border p-3">{notice}</p>}
        <BudgetSelector
          userId={userId}
          currentGroupId={groupId || undefined}
          disabled={mutations > 0}
          onSelect={(id) => {
            navigate({ to: '/main', search: { budget: id ?? 'personal' } }).catch(() => undefined);
          }}
        />
      </div>
      <div key={`${userId}:${choice}`}>
        {groupId && <FamilySetup groupId={groupId} scope={scope} />}
        <MainPage />
      </div>
    </BudgetProvider>
  );
}
