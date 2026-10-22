import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useBudget, useCanManageRecord, BudgetLabel } from '@/entities/budgets';
import { type Income, useUpdateIncomeMutation } from '@/entities/incomes';
import { useDeleteTransactionMutation } from '@/entities/transactions';
import { invalidateBudget, isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { hasValidMoneyPrecision } from '@/shared/lib/currency';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

import { getIncomeEditPatch, recoverMissingIncome } from '../model/income-edit';

export function IncomeActions({ income, onUnavailable }: {
  income: Income;
  onUnavailable?: () => void;
}) {
  const client = useQueryClient();
  const { scope } = useBudget();
  const allowed = useCanManageRecord(income.createdBy);
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const archived = accounts.data?.find((a) => a._id === income.accountId)?.archivedAt;
  const update = useUpdateIncomeMutation();
  const remove = useDeleteTransactionMutation();
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [amount, setAmount] = useState(String(income.amount));
  const [description, setDescription] = useState(income.description ?? '');
  const [baseline, setBaseline] = useState({ amount: income.amount, description: income.description ?? '' });
  const pending = update.isPending || remove.isPending;
  const valid = Number(amount) > 0 && hasValidMoneyPrecision(Number(amount), income.currency);
  if (income.origin?.type === 'debt') {
    return (
      <Button.Base
        variant="outline"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('babki:open-debt', { detail: income.origin?.id }));
        }}
      >
        Перейти к долгу
      </Button.Base>
    );
  }
  if (!allowed || archived) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button.Base
        variant="outline"
        onClick={() => {
          update.reset();
          setAmount(String(income.amount));
          setDescription(income.description ?? '');
          setBaseline({ amount: income.amount, description: income.description ?? '' });
          setMode('edit');
        }}
      >
        Изменить
      </Button.Base>
      <Button.Base
        variant="outline"
        onClick={() => {
          remove.reset();
          setMode('delete');
        }}
      >
        Удалить
      </Button.Base>
      <Dialog.Base open={mode !== null} onOpenChange={(open) => !open && !pending && setMode(null)}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{mode === 'delete' ? 'Удалить доход?' : 'Изменить доход'}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <BudgetLabel />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  if (mode === 'delete') {
                    await remove.mutateAsync({ transactionId: income._id, transactionType: 'income' });
                  } else {
                    if (!valid) return;
                    const payload = getIncomeEditPatch({ amount, description }, baseline);
                    if (Object.keys(payload).length > 0) {
                      await update.mutateAsync({ incomeId: income._id, payload });
                    }
                  }
                  setMode(null);
                } catch (error) {
                  if (!isActiveBudgetIdentity(client, scope)) return;
                  await recoverMissingIncome(error, {
                    close: () => setMode(null),
                    notify: () => onUnavailable?.(),
                    refresh: () => invalidateBudget(client, scope),
                  });
                  // Other failures remain in the mutation state for an explicit retry.
                }
              }}
              className="flex flex-col gap-3"
            >
              {mode === 'delete' ? <p>Доход будет удалён, остаток счёта пересчитается.</p> : (
                <>
                  <Input.Label htmlFor={`income-amount-${income._id}`}>
                    Сумма (
                    {income.currency}
                    )
                  </Input.Label>
                  <Input.Base
                    id={`income-amount-${income._id}`}
                    value={amount}
                    disabled={pending}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                  />
                  <Input.Label htmlFor={`income-description-${income._id}`}>Описание</Input.Label>
                  <Input.Base
                    id={`income-description-${income._id}`}
                    value={description}
                    disabled={pending}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={1000}
                  />
                  {!valid && <p role="alert">Укажите положительную сумму с точностью валюты.</p>}
                </>
              )}
              {(update.isError || remove.isError) && (
                <p role="alert">Не удалось выполнить действие. Проверьте права и повторите.</p>
              )}
              <Button.Base type="submit" disabled={pending || (mode === 'edit' && !valid)}>
                {pending ? 'Сохранение…' : mode === 'delete' ? 'Удалить' : 'Сохранить'}
              </Button.Base>
              <Button.Base
                variant="outline"
                disabled={pending}
                onClick={() => setMode(null)}
              >
                Отмена
              </Button.Base>
            </form>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Base>
    </div>
  );
}
