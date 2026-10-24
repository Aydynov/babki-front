import { actorLabel } from '@/shared/lib/actor-label';
import { useExpensesQueryOptions } from '@/entities/expenses';
import { useCanManageRecord } from '@/entities/budgets';
import { type Plan } from '@/entities/plans';
import { ExpenseCategoryBadge, useExpenseCategoriesQueryOptions } from '@/entities/expense-categories';
import { formatMoney } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Menu } from '@base-ui/react';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Icon } from '@/shared/ui/icon';
import { Dialog } from '@/shared/ui/dialog';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import i18next from 'i18next';
import {
  LucideArchive, LucideArrowRight, LucideCheck, LucidePencil, LucideTrash2,
} from 'lucide-react';
import { type FC, type RefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';

const locale = i18next.language;

const formatDate = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface PlanViewProps {
  plan: Plan;
  pending: boolean;
  actionRef: RefObject<HTMLButtonElement | null>;
  executeRef: RefObject<HTMLButtonElement | null>;
  onArchive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExecute: () => void;
  onClose: () => void;
}

export const PlanView: FC<PlanViewProps> = ({
  plan,
  pending,
  actionRef,
  executeRef,
  onArchive,
  onEdit,
  onDelete,
  onExecute,
  onClose,
}) => {
  const { t } = useTranslation();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const canManage = useCanManageRecord('createdBy' in plan ? plan.createdBy : undefined);
  const actual = useQuery({
    ...useExpensesQueryOptions().findOne(plan.expenseId ?? ''),
    enabled: Boolean(plan.expenseId),
    retry: false,
  });
  const editable = canManage && !plan.archivedAt && plan.status === 'active';
  const { data: categoriesData } = useQuery(useExpenseCategoriesQueryOptions().findAll());
  const category = (categoriesData ?? []).find((c) => c._id === plan.categoryId);

  const menuClass = 'flex h-8 items-center gap-2 rounded-md px-2 text-sm outline-none data-highlighted:bg-accent';

  return (
    <>
      <ScrollDialog.Layout
        title={t('plans.details.title')}
        closeLabel={t('plans.details.close')}
        onClose={onClose}
        closeDisabled={pending}
        headerActions={canManage && !plan.archivedAt ? (
          <Menu.Root>
            <Menu.Trigger
              ref={actionRef}
              render={<Button.Icon />}
              aria-label={t('plans.details.actions.menu')}
              title={t('plans.details.actions.menu')}
              disabled={pending}
            >
              <Icon icon="IcDots20" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner
                align="end"
                sideOffset={4}
                className="z-50 outline-none"
              >
                <Menu.Popup className="rounded-lg border bg-popover p-1 shadow-md outline-none">
                  {editable && (
                    <Menu.Item className={menuClass} onClick={onEdit}>
                      <LucidePencil className="size-4" />
                      {t('plans.details.actions.edit')}
                    </Menu.Item>
                  )}
                  <Menu.Item className={menuClass} onClick={onArchive}>
                    <LucideArchive className="size-4" />
                    {t('plans.details.actions.archive')}
                  </Menu.Item>
                  {editable && !plan.expenseId && (
                    <Menu.Item className={`${menuClass} text-destructive`} onClick={onDelete}>
                      <LucideTrash2 className="size-4" />
                      {t('plans.details.actions.delete')}
                    </Menu.Item>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : undefined}
        actions={editable || (plan.expenseId && actual.data) ? (
          <>
            {plan.expenseId && actual.data && (
              <Button.Base
                variant="outline"
                onClick={() => setExpenseOpen(true)}
                disabled={pending}
              >
                {t('plans.details.actions.expense')}
              </Button.Base>
            )}
            {editable && (
              <Button.Base
                ref={executeRef}
                onClick={onExecute}
                disabled={pending || !category || category.isArchived}
              >
                <LucideCheck />
                {t('plans.details.actions.execute')}
              </Button.Base>
            )}
          </>
        ) : undefined}
      >
        {category?.isArchived && editable && (
          <Typography.Caption1>
            Исполнение недоступно: категория в архиве. Измените категорию плана.
          </Typography.Caption1>
        )}
        <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-caption-1 text-muted-foreground">
              {t('plans.details.fields.description')}
            </dt>
            <dd className="whitespace-pre-wrap text-body-2">{plan.description}</dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-caption-1 text-muted-foreground">
              {t('plans.details.fields.amount')}
            </dt>
            <dd className="flex flex-wrap items-center gap-2 tabular-nums">
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
            </dd>
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
            <dt className="text-caption-1 text-muted-foreground">
              {t('plans.details.fields.category')}
            </dt>
            <dd className="flex items-start">
              {category ? (
                <ExpenseCategoryBadge color={category.color}>{category.name}</ExpenseCategoryBadge>
              ) : (
                <Typography.Body2 className="text-muted-foreground">—</Typography.Body2>
              )}
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-caption-1 text-muted-foreground">
              {t('plans.details.fields.targetDate')}
            </dt>
            <dd className="text-body-2">{formatDate.format(new Date(plan.targetDate))}</dd>
          </div>
          <div>
            <dt className="text-caption-1 text-muted-foreground">{t('plans.details.fields.status')}</dt>
            <dd className="text-body-2">
              {plan.archivedAt ? t('plans.details.status.archived')
                : t(plan.status === 'closed' ? 'plans.details.status.closed' : 'plans.details.status.active')}
            </dd>
          </div>
          <div>
            <dt className="text-caption-1 text-muted-foreground">{t('plans.details.fields.author')}</dt>
            <dd className="text-body-2">{plan.createdByActor ? actorLabel(plan.createdByActor) : '—'}</dd>
          </div>
        </dl>
      </ScrollDialog.Layout>
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
    </>
  );
};
