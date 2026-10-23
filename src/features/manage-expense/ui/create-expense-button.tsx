import { useAccountsQueryOptions } from '@/entities/accounts';
import { useQuery } from '@tanstack/react-query';
import { useCreateExpenseMutation } from '@/entities/expenses';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Dialog as DialogPrimitive } from '@base-ui/react';
import { LucidePlus } from 'lucide-react';
import {
  type FC,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDefaultExpenseAccountId,
  getDefaultExpenseFormValues,
  mapCreateExpenseDto,
} from '../model/expense-form';
import { ExpenseForm } from './expense-form';

interface CreateExpenseButtonProps {
  className?: string;
}

export const CreateExpenseButton: FC<CreateExpenseButtonProps> = ({ className }) => {
  const { t } = useTranslation();
  const accountsQuery = useQuery(useAccountsQueryOptions().findAll());
  const createExpenseMutation = useCreateExpenseMutation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [defaultValues, setDefaultValues] = useState(getDefaultExpenseFormValues);

  const handleOpenChange = (nextOpen: boolean) => {
    if (createExpenseMutation.isPending) return;

    if (nextOpen) {
      setDefaultValues(getDefaultExpenseFormValues());
      setSession((value) => value + 1);
      createExpenseMutation.reset();
    }

    setOpen(nextOpen);
  };

  return (
    <Dialog.Base
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) createExpenseMutation.reset();
      }}
    >
      <DialogPrimitive.Trigger
        render={(
          <Button.Icon
            type="button"
            className={className}
            aria-label={t('expenses.create.open')}
          />
        )}
      >
        <LucidePlus />
      </DialogPrimitive.Trigger>

      <ExpenseForm
        key={session}
        defaultValues={{
          ...defaultValues,
          accountId: getDefaultExpenseAccountId(accountsQuery.data ?? []),
        }}
        initialAmountOverridden={false}
        pending={createExpenseMutation.isPending}
        submitError={createExpenseMutation.isError
          ? t('expenses.create.errors.submit')
          : undefined}
        title={t('expenses.create.title')}
        saveLabel={t('expenses.create.actions.save')}
        savingLabel={t('expenses.create.actions.saving')}
        closeLabel={t('expenses.create.close')}
        idPrefix="create-expense"
        onClearSubmitError={() => {
          if (createExpenseMutation.isError) createExpenseMutation.reset();
        }}
        onClose={() => handleOpenChange(false)}
        onSubmit={async (values) => {
          await createExpenseMutation.mutateAsync(mapCreateExpenseDto(values));
          setOpen(false);
        }}
      />
    </Dialog.Base>
  );
};
