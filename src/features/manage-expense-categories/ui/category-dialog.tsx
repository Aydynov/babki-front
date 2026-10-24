import {
  useEffect, useRef, useState, type ReactNode, type RefObject,
} from 'react';
import { Menu } from '@base-ui/react';
import { useTranslation } from 'react-i18next';
import { useBudgetPermission } from '@/entities/budgets';
import {
  type ExpenseCategory, useUpdateExpenseCategoryMutation, useDeleteExpenseCategoryMutation,
} from '@/entities/expense-categories';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Typography } from '@/shared/ui/typography';
import { CategoryForm } from './category-form';
import { CategoryConfirmDialog } from './category-confirm-dialog';
import { getCategoryMutationErrorMessage } from '../model/errors';

export function CategoryDialog({
  category, children, finalFocus, onClose, onUnavailable,
}: {
  category?: ExpenseCategory;
  children?: ReactNode;
  finalFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const { t } = useTranslation();
  const allowed = useBudgetPermission('manageCategories');
  const [editing, setEditing] = useState(!category);
  const [formPending, setFormPending] = useState(false);
  const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);
  const update = useUpdateExpenseCategoryMutation();
  const remove = useDeleteExpenseCategoryMutation();
  const pending = formPending || update.isPending || remove.isPending;
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (editing) contentRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
  }, [editing]);
  const close = () => {
    if (!pending && !confirmation) onClose();
  };
  const cancelEdit = () => {
    if (formPending) return;
    if (!category) onClose();
    else {
      setEditing(false);
      requestAnimationFrame(() => menuTrigger.current?.focus());
    }
  };
  const changeStatus = async () => {
    if (!category || pending || !allowed) return;
    try {
      await update.mutateAsync({ categoryId: category._id, payload: { isArchived: !category.isArchived } });
      onUnavailable();
    } catch {
      // The mutation exposes the error in the details or confirmation for retry.
    }
  };
  const beginConfirmation = (action: 'archive' | 'delete') => {
    update.reset();
    remove.reset();
    setConfirmation(action);
  };
  const menuItemClass = `
    flex h-8 cursor-default items-center rounded-md px-2 text-sm outline-none
    data-highlighted:bg-accent data-disabled:opacity-50
  `;
  return (
    <>
      <ScrollDialog.Base
        open
        onOpenChange={(open, details) => {
          if (open) return;
          if (pending || confirmation) {
            details.cancel();
            return;
          }
          if (editing && category && details.reason === 'escape-key') {
            details.cancel();
            cancelEdit();
            return;
          }
          onClose();
        }}
      >
        <ScrollDialog.Content
          ref={contentRef}
          finalFocus={finalFocus}
          className="max-w-xl"
        >
          {editing && allowed ? (
            <CategoryForm
              category={category}
              onClose={close}
              onCancel={cancelEdit}
              onSaved={() => {
                if (!category) onClose();
                else {
                  setEditing(false);
                  requestAnimationFrame(() => closeRef.current?.focus());
                }
              }}
              onPendingChange={setFormPending}
            />
          ) : (
            <ScrollDialog.Layout
              title={category?.name}
              closeLabel={t('expenseCategories.management.close')}
              onClose={close}
              closeRef={closeRef}
              closeDisabled={pending || Boolean(confirmation)}
              headerActions={allowed && category ? (
                <Menu.Root>
                  <Menu.Trigger
                    ref={menuTrigger}
                    aria-label={t('expenseCategories.management.actionsLabel')}
                    disabled={pending}
                    render={<Button.Icon type="button" />}
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
                        <Menu.Item
                          label={t('expenseCategories.management.edit')}
                          className={menuItemClass}
                          onClick={() => {
                            update.reset();
                            setEditing(true);
                          }}
                        >
                          {t('expenseCategories.management.edit')}
                        </Menu.Item>
                        <Menu.Item
                          label={t(category.isArchived
                            ? 'expenseCategories.management.restore' : 'expenseCategories.management.archive')}
                          className={menuItemClass}
                          onClick={() => {
                            if (category.isArchived) changeStatus().catch(() => undefined);
                            else beginConfirmation('archive');
                          }}
                        >
                          {t(category.isArchived
                            ? 'expenseCategories.management.restore' : 'expenseCategories.management.archive')}
                        </Menu.Item>
                        <Menu.Item
                          label={t('expenseCategories.management.actions.delete')}
                          className={`${menuItemClass} text-destructive data-highlighted:bg-destructive/10`}
                          onClick={() => beginConfirmation('delete')}
                        >
                          {t('expenseCategories.management.actions.delete')}
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              ) : undefined}
            >
              {children}
              {update.isError && !confirmation && (
                <Typography.Body2 role="alert" className="text-destructive">
                  {t('expenseCategories.management.errors.generic')}
                </Typography.Body2>
              )}
            </ScrollDialog.Layout>
          )}
        </ScrollDialog.Content>
      </ScrollDialog.Base>
      {category && (
        <CategoryConfirmDialog
          action={confirmation ?? 'delete'}
          finalFocus={menuTrigger}
          open={Boolean(confirmation)}
          pending={pending}
          error={confirmation === 'delete' && remove.isError
            ? getCategoryMutationErrorMessage(remove.error)
            : confirmation === 'archive' && update.isError
              ? t('expenseCategories.management.errors.generic') : undefined}
          onCancel={() => {
            if (!pending) {
              setConfirmation(null);
              update.reset();
              remove.reset();
            }
          }}
          onConfirm={async () => {
            if (!allowed || pending) return;
            if (confirmation === 'archive') await changeStatus();
            else if (confirmation === 'delete') {
              await remove.mutateAsync({ categoryId: category._id });
              onUnavailable();
            }
          }}
        />
      )}
    </>
  );
}
