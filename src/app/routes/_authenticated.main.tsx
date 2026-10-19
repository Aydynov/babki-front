import { createFileRoute } from '@tanstack/react-router';
import { validateBudgetSearch } from '@/shared/lib/budget-scope';
import { BudgetMainPage } from '@/pages/main';

export const Route = createFileRoute('/_authenticated/main')({
  validateSearch: validateBudgetSearch,
  component: BudgetMainPage,
});
