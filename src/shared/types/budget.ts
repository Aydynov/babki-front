export interface BudgetScope {
  userId: string;
  spaceId: string;
}

export interface BudgetSpace {
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
