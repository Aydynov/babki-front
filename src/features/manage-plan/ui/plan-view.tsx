import { type Plan } from '@/entities/plans';
import { ExpenseCategoryBadge, expenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import { LucideCheck, LucidePencil, LucideTrash2 } from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalCloseButton } from './modal-close-button';

const locale = i18next.language;

const formatDate = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface PlanViewProps {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
  onExecute: () => void;
  onClose: () => void;
}

export const PlanView: FC<PlanViewProps> = ({
  plan,
  onEdit,
  onDelete,
  onExecute,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: categoriesData } = useQuery(expenseCategoriesQueryOptions.findAll());
  const category = (categoriesData ?? []).find((c) => c._id === plan.categoryId);

  return (
    <div>
      <Dialog.Header>
        <Dialog.Title>{t('plans.details.title')}</Dialog.Title>
        <ModalCloseButton onClick={onClose} label={t('plans.details.close')} />
      </Dialog.Header>

      <Dialog.Body>
        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('plans.details.fields.description')}
          </Typography.Caption1>
          <Typography.Body2>{plan.description}</Typography.Body2>
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('plans.details.fields.category')}
          </Typography.Caption1>
          {category ? (
            <ExpenseCategoryBadge color={category.color}>{category.name}</ExpenseCategoryBadge>
          ) : (
            <Typography.Body2 className="text-muted-foreground">—</Typography.Body2>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('plans.details.fields.amount')}
          </Typography.Caption1>
          <Typography.Body2>{formatMoney(plan.amount, plan.currency)}</Typography.Body2>
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('plans.details.fields.targetDate')}
          </Typography.Caption1>
          <Typography.Body2>{formatDate.format(new Date(plan.targetDate))}</Typography.Body2>
        </div>
      </Dialog.Body>

      <Dialog.Footer className="justify-between">
        <Button.Base variant="destructive" onClick={onDelete}>
          <LucideTrash2 />
          {t('plans.details.actions.delete')}
        </Button.Base>
        <div className="flex flex-wrap gap-2.5">
          <Button.Base variant="outline" onClick={onEdit}>
            <LucidePencil />
            {t('plans.details.actions.edit')}
          </Button.Base>
          <Button.Base onClick={onExecute}>
            <LucideCheck />
            {t('plans.details.actions.execute')}
          </Button.Base>
        </div>
      </Dialog.Footer>
    </div>
  );
};
