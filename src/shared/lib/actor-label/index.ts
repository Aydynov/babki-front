import type { FinancialActor } from '@/shared/api';

export const actorLabel = (actor: FinancialActor) => (
  actor.isAnonymized
    ? 'Удалённый пользователь'
    : [actor.firstName, actor.lastName].filter(Boolean).join(' ') || 'Участник'
);
