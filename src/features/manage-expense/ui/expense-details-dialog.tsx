import { useAccountsQueryOptions } from '@/entities/accounts';
import { useCanManageRecord } from '@/entities/budgets';
import { type Expense, useUpdateExpenseMutation } from '@/entities/expenses';
import { Dialog } from '@/shared/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import {
  type FC, type RefObject, useEffect, useRef, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getEditExpenseFormValues, isExpenseAmountOverridden, mapUpdateExpenseDto } from '../model/expense-form';
import { ExpenseForm } from './expense-form';
import { ExpenseView } from './expense-view';

interface ExpenseDetailsDialogProps {
  expense: Expense;
  initialMode: 'view' | 'edit';
  currentPeriod: boolean;
  finalFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
  onRetryCategory: () => void;
}

export const ExpenseDetailsDialog: FC<ExpenseDetailsDialogProps> = ({
  expense, initialMode, currentPeriod, finalFocus, onClose, onRetryCategory,
}) => {
  const { t } = useTranslation();
  const [savedExpense, setSavedExpense] = useState<{ value: Expense; source: Expense } | null>(null);
  const activeExpense = savedExpense?.source === expense ? savedExpense.value : expense;
  const [mode, setMode] = useState(initialMode);
  const allowed = useCanManageRecord(activeExpense.createdBy, activeExpense.participantId);
  const canAssignParticipant = useCanManageRecord(activeExpense.createdBy);
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const account = accounts.data?.find(({ _id }) => _id === activeExpense.accountId);
  const canEdit = currentPeriod && allowed && Boolean(account && !account.archivedAt);
  const mutation = useUpdateExpenseMutation();
  const canSubmitRef = useRef(canEdit);
  canSubmitRef.current = canEdit;
  const viewActionRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editing = mode === 'edit' && (canEdit || mutation.isPending);
  const defaultValues = getEditExpenseFormValues(activeExpense);
  const amountOverridden = isExpenseAmountOverridden(defaultValues.amount, defaultValues.items, activeExpense.currency);

  useEffect(() => {
    if (!canEdit && !mutation.isPending) setMode('view');
  }, [canEdit, mutation.isPending]);

  useEffect(() => {
    if (!editing) viewActionRef.current?.focus();
    else contentRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
  }, [editing]);

  const returnToView = () => {
    if (mutation.isPending) return;
    mutation.reset();
    setMode('view');
  };

  return (
    <Dialog.Base
      open
      onOpenChange={(open, details) => {
        if (open) return;
        if (mutation.isPending) {
          details.cancel();
          return;
        }
        if (editing && details.reason === 'escape-key') {
          details.cancel();
          returnToView();
          return;
        }
        onClose();
      }}
    >
      <Dialog.Content
        ref={contentRef}
        className="flex max-w-2xl flex-col overflow-hidden"
        finalFocus={finalFocus}
      >
        {editing ? (
          <ExpenseForm
            embedded
            defaultValues={defaultValues}
            initialAmountOverridden={amountOverridden}
            currentCategory={activeExpense.category}
            canAssignParticipant={canAssignParticipant}
            participantActor={activeExpense.participantActor}
            dateDisabled
            immutableCurrency={activeExpense.currency}
            pending={mutation.isPending}
            submitError={mutation.isError ? t('expenses.edit.errors.submit') : undefined}
            title={t('expenses.edit.title')}
            saveLabel={t('expenses.edit.actions.save')}
            savingLabel={t('expenses.edit.actions.saving')}
            closeLabel={t('expenses.edit.close')}
            idPrefix="edit-expense"
            onClearSubmitError={() => {
              if (mutation.isError) mutation.reset();
            }}
            onClose={onClose}
            onCancel={returnToView}
            onSubmit={async (values) => {
              if (!canSubmitRef.current) return;
              const updated = await mutation.mutateAsync({
                expenseId: activeExpense._id,
                payload: mapUpdateExpenseDto(canAssignParticipant ? values : {
                  ...values,
                  participantId: activeExpense.participantId,
                  originalParticipantId: activeExpense.participantId,
                }),
              });
              setSavedExpense({ value: updated, source: expense });
              setMode('view');
              mutation.reset();
            }}
          />
        ) : (
          <ExpenseView
            expense={activeExpense}
            canEdit={canEdit}
            actionRef={viewActionRef}
            onEdit={() => setMode('edit')}
            onClose={onClose}
            onRetryCategory={onRetryCategory}
          />
        )}
      </Dialog.Content>
    </Dialog.Base>
  );
};
