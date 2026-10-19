import { useBudget } from '../model/context';

export function BudgetLabel() {
  const { title } = useBudget();
  return (
    <p className="mb-4 flex min-w-0 items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
      <span className="shrink-0">Бюджет</span>
      <span className="truncate font-medium text-foreground" title={title}>{title}</span>
    </p>
  );
}
