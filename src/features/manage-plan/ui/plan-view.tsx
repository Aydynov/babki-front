import { useExpensesQueryOptions } from '@/entities/expenses';
import { useBudgetScope, useCanManageRecord } from '@/entities/budgets';
import { useArchivePlanMutation } from '@/entities/plans';
import { type Plan } from '@/entities/plans';
import { ExpenseCategoryBadge, useExpenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import { LucideCheck, LucidePencil, LucideTrash2 } from 'lucide-react';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmActionButton } from './confirm-action-button';
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
  const [expenseOpen, setExpenseOpen] = useState(false);
  const scope = useBudgetScope();
  const canManage = useCanManageRecord('createdBy' in plan ? plan.createdBy : undefined);
  const archive = useArchivePlanMutation();
  const actual = useQuery({
    ...useExpensesQueryOptions().findOne(plan.expenseId ?? ''),
    enabled: Boolean(plan.expenseId),
    retry: false,
  });
  const editable = canManage && !plan.archivedAt && plan.status === 'active';
  const { data: categoriesData } = useQuery(useExpenseCategoriesQueryOptions().findAll());
  const category = (categoriesData ?? []).find((c) => c._id === plan.categoryId);

  return (
    <div>
      <Dialog.Header>
        <Dialog.Title>{t('plans.details.title')}</Dialog.Title>
        <ModalCloseButton onClick={onClose} label={t('plans.details.close')} />
      </Dialog.Header>

      <Dialog.Body>
        {'createdByActor' in plan && (
          <Typography.Caption1>
            Автор:
            {' '}
            {plan.createdByActor.isAnonymized ? 'Участник' : [
              plan.createdByActor.firstName, plan.createdByActor.lastName,
            ].filter(Boolean).join(' ') || 'Участник'}
          </Typography.Caption1>
        )}
        <Typography.Caption1>
          {plan.archivedAt ? 'Архив · Только чтение'
            : (plan.status === 'closed' ? 'Исполнен' : 'Активен')}
        </Typography.Caption1>
        {plan.expenseId && (
          <Typography.Caption1>
            Исполнен. Связанный расход:
            {' '}
            {plan.expenseId}
            .
            {actual.isLoading && ' Загрузка фактической суммы…'}
            {actual.data && ` Фактически: ${formatMoney(actual.data.amount, plan.currency)}`}
            {actual.isError && ' Связанная запись недоступна. План остаётся исполненным.'}
            {actual.data && (
              <Button.Base variant="outline" onClick={() => setExpenseOpen(true)}>Открыть расход</Button.Base>
            )}
          </Typography.Caption1>
        )}
        {category?.isArchived && editable && (
          <Typography.Caption1>
            Исполнение недоступно: категория в архиве. Измените категорию плана.
          </Typography.Caption1>
        )}
        {archive.isError && <Typography.Caption1>Не удалось архивировать план. Повторите явно.</Typography.Caption1>}
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
        <Button.Base
          variant="destructive"
          onClick={onDelete}
          disabled={!editable || Boolean(plan.expenseId)}
        >
          <LucideTrash2 />
          {t('plans.details.actions.delete')}
        </Button.Base>
        <div className="flex flex-wrap gap-2.5">
          {scope.kind === 'group' && canManage && !plan.archivedAt && (
            <ConfirmActionButton
              description="Архивировать план? Изменение, исполнение и отмена станут недоступны. Восстановления нет."
              pending={archive.isPending}
              onConfirm={() => archive.mutateAsync(plan._id).then(onClose)}
            >
              В архив
            </ConfirmActionButton>
          )}
          <Button.Base
            variant="outline"
            onClick={onEdit}
            disabled={!editable}
          >
            <LucidePencil />
            {t('plans.details.actions.edit')}
          </Button.Base>
          <Button.Base onClick={onExecute} disabled={!editable || !category || category.isArchived}>
            <LucideCheck />
            {t('plans.details.actions.execute')}
          </Button.Base>
        </div>
      </Dialog.Footer>
      <Dialog.Base open={expenseOpen} onOpenChange={setExpenseOpen}>
        <Dialog.Content>
          <Dialog.Header><Dialog.Title>Фактический расход</Dialog.Title></Dialog.Header>
          <Dialog.Body>
            {actual.data && (
              <>
                <Typography.Body2>{formatMoney(actual.data.amount, actual.data.currency)}</Typography.Body2>
                <Typography.Body2>{actual.data.description || 'Без описания'}</Typography.Body2>
                <Typography.Caption1>{formatDate.format(new Date(actual.data.transactionDate))}</Typography.Caption1>
                <Typography.Caption1>
                  Создан исполнением плана
                  {plan._id}
                </Typography.Caption1>
              </>
            )}
          </Dialog.Body>
          <Dialog.Footer><Button.Base onClick={() => setExpenseOpen(false)}>Закрыть</Button.Base></Dialog.Footer>
        </Dialog.Content>
      </Dialog.Base>
    </div>
  );
};
