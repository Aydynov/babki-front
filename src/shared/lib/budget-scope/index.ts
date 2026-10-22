import { defaultParseSearch } from '@tanstack/react-router';
import type { BudgetScope } from '../../types/budget';

const validSpaceId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const requireScope = (scope: BudgetScope) => {
  if (!scope || !scope.userId || !validSpaceId(scope.spaceId)) {
    throw new Error('Financial requests require a confirmed space and user');
  }
  return scope;
};

export const budgetPath = (scope: BudgetScope, path: string) => {
  requireScope(scope);
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid financial resource path');
  return `/spaces/${scope.spaceId}${path}`;
};

export const scopedKey = (scope: BudgetScope, key: readonly unknown[]) => {
  requireScope(scope);
  return [key[0], scope.userId, scope.spaceId, ...key.slice(1)];
};

export const resolveBudgetChoice = (explicit: unknown, preference?: unknown): string => {
  const choice = explicit === undefined ? preference : explicit;
  return validSpaceId(choice) ? choice : '';
};

export const readBudgetPreference = (userId: string) => {
  try {
    const value = window.localStorage.getItem(`babki.space.${userId}`);
    return validSpaceId(value) ? value : null;
  } catch {
    return null;
  }
};

export const saveBudgetPreference = (userId: string, spaceId: string | null) => {
  try {
    if (validSpaceId(spaceId)) window.localStorage.setItem(`babki.space.${userId}`, spaceId);
    else window.localStorage.removeItem(`babki.space.${userId}`);
  } catch { /* Optional preference storage. */ }
};

export const utcPeriod = <T extends { fromDate?: string; toDate?: string }>(period: T): T => ({
  ...period,
  ...(period.fromDate && { fromDate: `${period.fromDate.slice(0, 10)}T00:00:00.000Z` }),
  ...(period.toDate && { toDate: `${period.toDate.slice(0, 10)}T23:59:59.999Z` }),
});

// Preserve digit-only ObjectIds before TanStack's numeric JSON parser loses precision.
export const parseBudgetSearch = (search: string): Record<string, unknown> => {
  const parsed: Record<string, unknown> = defaultParseSearch(search);
  const values = new URLSearchParams(search).getAll('spaceId');
  if (values.length > 1) parsed.spaceId = '';
  else if (values.length === 1 && typeof parsed.spaceId !== 'string') [parsed.spaceId] = values;
  return parsed;
};

export const validateBudgetSearch = (search: Record<string, unknown>): { spaceId?: string } => {
  if (search.spaceId === undefined) return {};
  return { spaceId: resolveBudgetChoice(search.spaceId) };
};
