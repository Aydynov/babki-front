export type BudgetScope = | { kind: 'personal'; userId: string; groupId?: undefined }
  | { kind: 'group'; userId: string; groupId: string };

export interface BudgetGroup {
  id: string;
  name: string;
  role: 'owner' | 'member';
  permissions: {
    manageAccounts: boolean;
    manageCategories: boolean;
    manageLimits: boolean;
    manageTransactions: boolean;
  };
}
