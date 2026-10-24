import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LucidePlus } from 'lucide-react';
import { useBudgetPermission } from '@/entities/budgets';
import { Button } from '@/shared/ui/button';
import { CategoryDialog } from './category-dialog';

export function CreateCategoryButton({ hidden }: { hidden?: boolean }) {
  const { t } = useTranslation();
  const allowed = useBudgetPermission('manageCategories');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!allowed) return null;
  return (
    <>
      <Button.Icon
        ref={triggerRef}
        hidden={hidden}
        aria-label={t('expenseCategories.management.add')}
        onClick={() => setOpen(true)}
      >
        <LucidePlus />
      </Button.Icon>
      {open && (
        <CategoryDialog
          finalFocus={triggerRef}
          onClose={() => setOpen(false)}
          onUnavailable={() => setOpen(false)}
        />
      )}
    </>
  );
}
