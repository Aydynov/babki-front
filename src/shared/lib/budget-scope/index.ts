import { defaultParseSearch } from '@tanstack/react-router';
import type { BudgetScope } from '../../types/budget';

export const budgetPath = (scope: BudgetScope | undefined, path: string) => (
  scope?.kind === 'group' ? `/groups/${scope.groupId}${path}` : path
);

export const scopedKey = (scope: BudgetScope | undefined, key: readonly unknown[]) => (
  scope ? [key[0], scope.userId, scope.kind, scope.groupId ?? scope.userId, ...key.slice(1)] : key
);

export const resolveBudgetChoice = (explicit: unknown, preference: unknown): string => {
  const choice = explicit === undefined ? preference : explicit;
  return typeof choice === 'string' && /^[a-f\d]{24}$/i.test(choice) ? choice : 'personal';
};

export const utcPeriod = <T extends { fromDate?: string; toDate?: string }>(period: T): T => ({
  ...period,
  ...(period.fromDate && { fromDate: `${period.fromDate.slice(0, 10)}T00:00:00.000Z` }),
  ...(period.toDate && { toDate: `${period.toDate.slice(0, 10)}T23:59:59.999Z` }),
});

export const readBudgetPreference = (userId: string) => {
  try {
    return window.localStorage.getItem(`babki.budget.${userId}`);
  } catch {
    return null;
  }
};

export const saveBudgetPreference = (userId: string, value: string) => {
  try {
    window.localStorage.setItem(`babki.budget.${userId}`, value);
  } catch { /* Storage is optional. */ }
};

// TanStack JSON-parses query values. Keep digit-only ObjectIds before numeric precision is lost,
// while accepting quoted strings emitted by the router's default search serializer.
export const parseBudgetSearch = (search: string): Record<string, unknown> => {
  const parsed: Record<string, unknown> = defaultParseSearch(search);
  const values = new URLSearchParams(search).getAll('budget');
  if (values.length > 1) parsed.budget = 'personal';
  else if (values.length === 1 && typeof parsed.budget !== 'string') [parsed.budget] = values;
  return parsed;
};

export const validateBudgetSearch = (search: Record<string, unknown>): { budget?: string } => {
  if (search.budget === undefined) return {};
  return { budget: typeof search.budget === 'string' ? search.budget : 'personal' };
};
