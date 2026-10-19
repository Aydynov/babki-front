import { createContext, useContext } from 'react';
import type { BudgetGroup, BudgetScope } from '@/shared/types';

export interface BudgetContextValue {
  scope: BudgetScope;
  group?: BudgetGroup;
  title: string;
}

export const BudgetContext = createContext<BudgetContextValue | null>(null);
export const BudgetProvider = BudgetContext.Provider;
export const useBudget = () => {
  const budget = useContext(BudgetContext);
  if (!budget) throw new Error('Financial UI requires a confirmed budget');
  return budget;
};
export const useBudgetScope = () => useBudget().scope;
export const useBudgetPermission = (permission: keyof BudgetGroup['permissions']) => {
  const { scope, group } = useBudget();
  return scope.kind === 'personal' || group?.permissions[permission] === true;
};
export const useCanManageRecord = (createdBy?: string, participantId?: string) => {
  const { scope, group } = useBudget();
  return scope.kind === 'personal' || group?.role === 'owner' || group?.permissions.manageTransactions === true
    || createdBy === scope.userId || participantId === scope.userId;
};
