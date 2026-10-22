import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  LucideArrowLeft, LucideCheck, LucideHome, LucideLogIn, LucideUserPlus,
} from 'lucide-react';
import { Link, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { spaceKeys, spacesQueryOptions } from '@/entities/spaces';
import { getAccessToken } from '@/shared/api';
import { pendingInvitation } from '@/shared/lib/pending-invitation';
import { Button } from '@/shared/ui/button';
import { invitationsApi } from '../api/invitations.api';
import { invitationErrorStatus, invitationRetryAfter } from '../model/invitation-errors';
import type { InvitationPreview } from '../model/schemas';

export function JoinInvitation({ userId }: { userId: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(() => pendingInvitation.read());
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [checkSpaces, setCheckSpaces] = useState(false);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const remaining = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!pending && !remaining) return undefined;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (!pendingInvitation.read()) {
        setPending(null);
        setPreview(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pending, remaining]);
  const request = useCallback(async (action: 'preview' | 'accept') => {
    if (!userId || submitting.current || Date.now() < blockedUntil) return;
    const invitation = pendingInvitation.read();
    if (!invitation) {
      setPending(null);
      setPreview(null);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setMessage('');
    const identity = getAccessToken();
    const active = () => mounted.current && identity === getAccessToken();
    try {
      if (action === 'preview') {
        const result = await invitationsApi.preview(invitation.token);
        if (active() && pendingInvitation.read()?.token === invitation.token) {
          pendingInvitation.shorten(Date.parse(result.expiresAt));
          setPending(pendingInvitation.read());
          setPreview(result);
        }
      } else {
        const result = await invitationsApi.accept(invitation.token);
        if (!active()) return;
        pendingInvitation.clear();
        setPending(null);
        setPreview(null);
        // Membership is committed; a failed refresh must not turn acceptance into a retryable POST.
        await queryClient.invalidateQueries({ queryKey: spaceKeys.all(userId) }).catch(() => undefined);
        if (!active()) return;
        await queryClient.fetchQuery(spacesQueryOptions.detail(userId, result.spaceId)).catch(() => undefined);
        if (active()) router.history.replace(`/main?spaceId=${result.spaceId}`);
      }
    } catch (error) {
      if (!active()) return;
      const status = invitationErrorStatus(error);
      if (status === 400 || status === 409) {
        pendingInvitation.clear();
        setPending(null);
        setPreview(null);
        setCheckSpaces(status === 409);
        setMessage(status === 409 ? 'Вы уже состоите в этом пространстве.'
          : 'Приглашение недействительно. Попросите новую ссылку.');
      } else if (status === 429) {
        const time = Date.now();
        setNow(time);
        setBlockedUntil(time + invitationRetryAfter(error, time) * 1000);
        setMessage('Слишком много запросов. Дождитесь окончания паузы.');
      } else if (status !== 401) {
        setMessage(action === 'accept'
          ? 'Ответ о вступлении не получен. Проверьте «Мои пространства» перед явным повтором.'
          : 'Не удалось проверить приглашение. Повторите позже.');
        if (action === 'accept') setCheckSpaces(true);
      }
    } finally {
      submitting.current = false;
      if (active()) setBusy(false);
    }
  }, [blockedUntil, queryClient, router, userId]);
  // Deferred one-shot entry preview avoids a duplicate request during StrictMode effect replay.
  const initialPreview = useRef(request);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      initialPreview.current('preview');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const cancel = () => {
    pendingInvitation.clear();
    setPending(null);
    setPreview(null);
    setMessage('Вступление отменено. Для продолжения откройте исходную ссылку.');
  };
  return (
    <div className="flex min-w-0 flex-col gap-5">
      {message && <p role="status" className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">{message}</p>}
      {!pending && !message && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Откройте ссылку приглашения, которую прислал владелец пространства.
        </p>
      )}
      {pending && !pending.persistent && (
      <p className="text-sm text-muted-foreground">
        Хранилище вкладки недоступно. После обновления страницы потребуется снова открыть ссылку.
      </p>
      )}
      {pending && !userId && (
      <>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Войдите или зарегистрируйтесь, чтобы посмотреть приглашение и подтвердить вступление.
        </p>
        <div className="flex flex-col gap-2">
          <Button.Base
            nativeButton={false}
            size="lg"
            render={<Link to="/login" search={{ redirect: '/join' }} />}
          >
            <LucideLogIn aria-hidden="true" />
            {' '}
            Войти
          </Button.Base>
          <Button.Base
            nativeButton={false}
            size="lg"
            variant="outline"
            render={<Link to="/register" search={{ redirect: '/join' }} />}
          >
            <LucideUserPlus aria-hidden="true" />
            {' '}
            Зарегистрироваться
          </Button.Base>
        </div>
      </>
      )}
      {pending && userId && (
      <>
        {preview && (
        <div className="space-y-4 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <LucideHome className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-lg font-semibold">{preview.name}</h2>
              <p className="text-xs text-muted-foreground">
                Пространство
              </p>
            </div>
          </div>
          <p className="border-t pt-4 text-sm leading-relaxed text-muted-foreground">
            Вы сможете просматривать общий бюджет. Владелец сможет дать вам права на управление финансами.
          </p>
          <p className="text-xs text-muted-foreground">
            {`Приглашение действует до ${new Date(preview.expiresAt).toLocaleString('ru-RU')}`}
          </p>
        </div>
        )}
        {busy && (
          <p role="status" className="text-sm text-muted-foreground">
            {preview ? 'Вступление…' : 'Проверка приглашения…'}
          </p>
        )}
        {remaining > 0 && (
        <p role="status" className="text-sm text-muted-foreground">{`Повторить можно через ${remaining} сек.`}</p>
        )}
        {preview
          ? (
            <Button.Base
              size="lg"
              disabled={busy || remaining > 0}
              onClick={() => {
                request('accept');
              }}
            >
              <LucideCheck aria-hidden="true" />
              {' '}
              Вступить
            </Button.Base>
          )
          : (
            <Button.Base
              size="lg"
              disabled={busy || remaining > 0}
              onClick={() => {
                request('preview');
              }}
            >
              Проверить приглашение
            </Button.Base>
          )}
      </>
      )}
      {pending && (
      <Button.Base
        variant="outline"
        disabled={busy}
        onClick={cancel}
      >
        Отмена
      </Button.Base>
      )}
      {checkSpaces && (
      <Button.Base
        nativeButton={false}
        variant="outline"
        render={<Link to="/spaces" />}
      >
        Мои пространства
      </Button.Base>
      )}
      <Button.Base
        nativeButton={false}
        variant="ghost"
        className="self-start"
        render={<Link to="/main" />}
      >
        <LucideArrowLeft aria-hidden="true" />
        {' '}
        К бюджету
      </Button.Base>
    </div>
  );
}
