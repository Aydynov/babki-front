import { actorLabel } from '@/shared/lib/actor-label';
import { useExpensesQueryOptions } from '@/entities/expenses';
import { useCanManageRecord } from '@/entities/budgets';
import { useArchivePlanMutation } from '@/entities/plans';
import { type Plan } from '@/entities/plans';
import { ExpenseCategoryBadge, useExpenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import {
  LucideArrowRight, LucideCheck, LucidePencil, LucideTrash2,
} from 'lucide-react';
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
            {actorLabel(plan.createdByActor)}
          </Typography.Caption1>
        )}
        <Typography.Caption1>
          {plan.archivedAt ? 'Архив · Только чтение'
            : (plan.status === 'closed' ? 'Исполнен' : 'Активен')}
        </Typography.Caption1>
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
          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            {plan.status === 'closed' && actual.data && (
              actual.data.amount !== plan.amount || actual.data.currency !== plan.currency
            ) ? (
              <>
                <Typography.Body2 className="text-muted-foreground">
                  <span className="sr-only">Запланировано: </span>
                  <s>{formatMoney(plan.amount, plan.currency)}</s>
                </Typography.Body2>
                <LucideArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <Typography.Body2>
                  <span className="sr-only">Фактически: </span>
                  {formatMoney(actual.data.amount, actual.data.currency)}
                </Typography.Body2>
              </>
              ) : <Typography.Body2>{formatMoney(plan.amount, plan.currency)}</Typography.Body2>}
          </div>
          {plan.expenseId && actual.isLoading && (
            <Typography.Caption1 className="text-muted-foreground">Загрузка фактической суммы…</Typography.Caption1>
          )}
          {plan.expenseId && actual.isError && (
            <Typography.Caption1 className="text-muted-foreground">
              Связанный расход недоступен. План остаётся исполненным.
            </Typography.Caption1>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Caption1 className="text-muted-foreground">
            {t('plans.details.fields.targetDate')}
          </Typography.Caption1>
          <Typography.Body2>{formatDate.format(new Date(plan.targetDate))}</Typography.Body2>
        </div>
      </Dialog.Body>

      <Dialog.Footer className="justify-between">
        {editable && !plan.expenseId && (
          <Button.Base variant="destructive" onClick={onDelete}>
            <LucideTrash2 />
            {t('plans.details.actions.delete')}
          </Button.Base>
        )}
        {plan.expenseId && actual.data && (
          <Button.Base variant="outline" onClick={() => setExpenseOpen(true)}>Связанный расход</Button.Base>
        )}
        <div className="flex flex-wrap gap-2.5">
          {canManage && !plan.archivedAt && (
            <ConfirmActionButton
              description="Архивировать план? Изменение, исполнение и отмена станут недоступны. Восстановления нет."
              pending={archive.isPending}
              onConfirm={() => archive.mutateAsync(plan._id).then(onClose)}
            >
              В архив
            </ConfirmActionButton>
          )}
          {editable && (
            <>
              <Button.Base variant="outline" onClick={onEdit}>
                <LucidePencil />
                {t('plans.details.actions.edit')}
              </Button.Base>
              <Button.Base onClick={onExecute} disabled={!category || category.isArchived}>
                <LucideCheck />
                {t('plans.details.actions.execute')}
              </Button.Base>
            </>
          )}
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
                  {' '}
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
