const KEY = 'babki.pendingInvitation';
const TTL = 30 * 60 * 1000;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
interface PendingInvitation { token: string; createdAt: number; expiresAt: number; persistent: boolean }
type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ExpiryScheduler = (callback: () => void, delay: number) => () => void;
const scheduleExpiry: ExpiryScheduler = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

export const createPendingInvitationStore = (
  getStorage: () => StorageAccess,
  now: () => number = Date.now,
  schedule: ExpiryScheduler = scheduleExpiry,
) => {
  let memory: PendingInvitation | null = null;
  let cancelExpiry: (() => void) | null = null;
  let scheduledDeadline = 0;
  const clear = () => {
    cancelExpiry?.();
    cancelExpiry = null;
    scheduledDeadline = 0;
    memory = null;
    try {
      getStorage().removeItem(KEY);
    } catch { /* Memory remains cleared. */ }
  };
  const armExpiry = () => {
    if (!memory || scheduledDeadline === memory.expiresAt) return;
    cancelExpiry?.();
    scheduledDeadline = memory.expiresAt;
    cancelExpiry = schedule(() => {
      cancelExpiry = null;
      scheduledDeadline = 0;
      if (memory && memory.expiresAt > now()) armExpiry();
      else clear();
    }, Math.max(0, memory.expiresAt - now()));
  };
  const persist = () => {
    if (!memory) return;
    try {
      getStorage().setItem(KEY, JSON.stringify({
        token: memory.token, createdAt: memory.createdAt, expiresAt: memory.expiresAt,
      }));
      memory.persistent = true;
    } catch {
      memory.persistent = false;
    }
    armExpiry();
  };
  const read = (): PendingInvitation | null => {
    if (!memory) {
      try {
        const raw = getStorage().getItem(KEY);
        const value: unknown = raw ? JSON.parse(raw) : null;
        if (value && typeof value === 'object' && 'token' in value && 'expiresAt' in value && 'createdAt' in value
          && typeof value.token === 'string' && tokenPattern.test(value.token)
          && typeof value.expiresAt === 'number' && Number.isFinite(value.expiresAt)
          && typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) && value.createdAt <= now()) {
          memory = {
            token: value.token,
            createdAt: value.createdAt,
            expiresAt: Math.min(value.expiresAt, value.createdAt + TTL),
            persistent: true,
          };
        }
      } catch { /* Storage failure allows the in-memory invitation. */ }
    }
    if (!memory || memory.expiresAt <= now()) {
      clear();
      return null;
    }
    armExpiry();
    return { ...memory };
  };
  return {
    read,
    clear,
    set: (token: string) => {
      clear();
      if (!tokenPattern.test(token)) return false;
      const createdAt = now();
      memory = {
        token, createdAt, expiresAt: createdAt + TTL, persistent: false,
      };
      persist();
      return true;
    },
    shorten: (expiresAt: number) => {
      if (!read() || !memory) return;
      memory.expiresAt = Math.min(memory.expiresAt, expiresAt);
      persist();
    },
  };
};

export const pendingInvitation = createPendingInvitationStore(() => window.sessionStorage);

export const captureInvitationFragment = () => {
  const { hash, pathname, search } = window.location;
  if (!hash) return;
  // Remove the secret before any session check or navigation.
  window.history.replaceState(window.history.state, '', `${pathname}${search}`);
  const params = new URLSearchParams(hash.slice(1));
  pendingInvitation.set(params.get('token') ?? '');
};
