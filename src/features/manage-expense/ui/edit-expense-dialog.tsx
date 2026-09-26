import {
  type Expense,
  useUpdateExpenseMutation,
} from '@/entities/expenses';
import { Dialog } from '@/shared/ui/dialog';
import type {
  FC,
  RefObject,
} from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getEditExpenseFormValues,
  isExpenseAmountOverridden,
  mapUpdateExpenseDto,
} from '../model/expense-form';
import { ExpenseForm } from './expense-form';

interface EditExpenseDialogProps {
  expense: Expense;
  open: boolean;
  finalFocus: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export const EditExpenseDialog: FC<EditExpenseDialogProps> = ({
  expense,
  open,
  finalFocus,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateExpenseMutation = useUpdateExpenseMutation();
  const defaultValues = useMemo(() => getEditExpenseFormValues(expense), [expense]);
  const initialAmountOverridden = useMemo(() => isExpenseAmountOverridden(
    defaultValues.amount,
    defaultValues.items,
  ), [defaultValues]);

  const handleClose = () => {
    if (updateExpenseMutation.isPending) return;
    updateExpenseMutation.reset();
    onClose();
  };

  return (
    <Dialog.Base
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      {open && (
        <ExpenseForm
          defaultValues={defaultValues}
          initialAmountOverridden={initialAmountOverridden}
          currentCategory={expense.category}
          dateDisabled
          immutableCurrency={expense.currency}
          pending={updateExpenseMutation.isPending}
          submitError={updateExpenseMutation.isError
            ? t('expenses.edit.errors.submit')
            : undefined}
          title={t('expenses.edit.title')}
          saveLabel={t('expenses.edit.actions.save')}
          savingLabel={t('expenses.edit.actions.saving')}
          closeLabel={t('expenses.edit.close')}
          idPrefix="edit-expense"
          finalFocus={finalFocus}
          onClearSubmitError={() => {
            if (updateExpenseMutation.isError) updateExpenseMutation.reset();
          }}
          onClose={handleClose}
          onSubmit={async (values) => {
            await updateExpenseMutation.mutateAsync({
              expenseId: expense._id,
              payload: mapUpdateExpenseDto(values),
            });
            onClose();
          }}
        />
      )}
    </Dialog.Base>
  );
};
