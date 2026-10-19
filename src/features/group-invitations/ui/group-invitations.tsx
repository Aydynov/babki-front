import { useEffect, useRef, useState } from 'react';
import {
  LucideCheck, LucideCopy, LucideLink2, LucidePlus, LucideUserPlus,
} from 'lucide-react';
import { getAccessToken } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { invitationsApi } from '../api/invitations.api';
import { invitationErrorStatus } from '../model/invitation-errors';
import type { CreatedInvitation } from '../model/schemas';

type InvitationList = Awaited<ReturnType<typeof invitationsApi.list>>;
const statusLabels = {
  pending: 'Ожидает', accepted: 'Принято', revoked: 'Отозвано', expired: 'Истекло',
};
function GroupInvitationsContent({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<InvitationList | null>(null);
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const mounted = useRef(false);
  const submitting = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const identity = getAccessToken();
    setLoading(true);
    setList(null);
    setMessage('');
    invitationsApi.list(groupId, page, controller.signal).then((value) => {
      if (!controller.signal.aborted && identity === getAccessToken()) setList(value);
    }).catch(() => {
      if (!controller.signal.aborted && identity === getAccessToken()) setMessage('Не удалось загрузить приглашения.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [groupId, page, revision]);
  const run = async (action: 'create' | 'revoke') => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setMessage('');
    const identity = getAccessToken();
    const active = () => mounted.current && identity === getAccessToken();
    try {
      if (action === 'create') {
        const result = await invitationsApi.create(groupId);
        if (active()) setCreated(result);
      } else if (revokeId) {
        await invitationsApi.revoke(groupId, revokeId);
        if (active()) {
          if (created?.id === revokeId) setCreated(null);
          setRevokeId(null);
          setMessage('Приглашение отозвано.');
        }
      }
      if (active()) setRevision((value) => value + 1);
    } catch (error) {
      if (active()) {
        const conflict = invitationErrorStatus(error) === 409;
        setMessage(conflict ? 'Состояние приглашения изменилось. Список обновлён.'
          : 'Не удалось выполнить действие. Проверьте список перед повтором.');
        if (conflict) {
          setRevokeId(null);
          setRevision((value) => value + 1);
        }
      }
    } finally {
      submitting.current = false;
      if (active()) setBusy(false);
    }
  };
  return (
    <Card.Base className="min-w-0 gap-4 p-5 sm:p-6" aria-label="Приглашения">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <LucideUserPlus className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold">Приглашения</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Поделитесь ссылкой с близкими. После вступления настройте их права в списке участников.
      </p>
      <Button.Base
        variant="outline"
        className="min-h-9 self-start"
        disabled={busy}
        onClick={() => {
          setCopied(false);
          setCreated(null);
          run('create');
        }}
      >
        <LucidePlus aria-hidden="true" />
        {' '}
        {busy ? 'Подождите…' : 'Создать приглашение'}
      </Button.Base>
      {created && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LucideLink2 className="size-4" aria-hidden="true" />
            {' '}
            Приглашение готово
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {`Действует до ${new Date(created.expiresAt).toLocaleString('ru-RU')}.`}
            {' '}
            Скопируйте ссылку сейчас — после ухода с экрана она будет недоступна.
          </p>
          <Button.Base
            className="self-start"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${window.location.origin}/join#token=${created.token}`);
                if (mounted.current) {
                  setCopied(true);
                  setMessage('Ссылка скопирована.');
                }
              } catch {
                if (mounted.current) setMessage('Буфер обмена недоступен. Разрешите копирование и повторите.');
              }
            }}
          >
            {copied ? <LucideCheck aria-hidden="true" /> : <LucideCopy aria-hidden="true" />}
            {copied ? 'Скопировано' : 'Копировать ссылку'}
          </Button.Base>
        </div>
      )}
      {message && <p role="status" className="rounded-lg bg-muted p-3 text-xs leading-relaxed">{message}</p>}
      {loading && (
      <div role="status" aria-label="Загрузка приглашений"><Skeleton className="h-16" /></div>
      )}
      {!loading && !list && (
      <Button.Base variant="outline" onClick={() => setRevision((v) => v + 1)}>
        Повторить загрузку
      </Button.Base>
      )}
      {list?.items.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Приглашений пока нет. Создайте первую ссылку для близкого человека.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {list?.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
            <div className="space-y-1.5">
              <p className={`flex items-center gap-2 text-xs font-medium
                ${item.status === 'pending' ? '' : 'text-muted-foreground'}`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full
                  ${item.status === 'pending' ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
                />
                {statusLabels[item.status]}
              </p>
              <p className="text-xs text-muted-foreground">
                {`До ${new Date(item.expiresAt).toLocaleString('ru-RU')}`}
              </p>
            </div>
            {item.status === 'pending' && (
            <Button.Base
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setRevokeId(item.id)}
            >
              Отозвать
            </Button.Base>
            )}
          </li>
        ))}
      </ul>
      {list && list.total > list.limit && (
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <Button.Base
          variant="outline"
          disabled={page === 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          Назад
        </Button.Base>
        <span>{`Страница ${page}`}</span>
        <Button.Base
          variant="outline"
          disabled={page * list.limit >= list.total || loading}
          onClick={() => setPage(page + 1)}
        >
          Далее
        </Button.Base>
      </div>
      )}
      <Dialog.Base
        open={Boolean(revokeId)}
        onOpenChange={(open) => {
          if (!open && !busy) setRevokeId(null);
        }}
      >
        <Dialog.Content>
          <Dialog.Title>Отозвать приглашение?</Dialog.Title>
          <Dialog.Description>По этой ссылке больше нельзя будет вступить в группу.</Dialog.Description>
          <Dialog.Footer>
            <Button.Base
              variant="outline"
              disabled={busy}
              onClick={() => setRevokeId(null)}
            >
              Отмена
            </Button.Base>
            <Button.Base
              disabled={busy}
              onClick={() => {
                run('revoke');
              }}
            >
              Отозвать
            </Button.Base>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </Card.Base>
  );
}
export function GroupInvitations({ groupId }: { groupId: string }) {
  return <GroupInvitationsContent key={groupId} groupId={groupId} />;
}
