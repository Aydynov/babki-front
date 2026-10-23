import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu } from '@base-ui/react';
import {
  LucideArrowLeft, LucideCheck, LucidePencil, LucideX,
} from 'lucide-react';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useBudget, useCanManageRecord } from '@/entities/budgets';
import { type Income, useUpdateIncomeMutation } from '@/entities/incomes';
import { useDeleteTransactionMutation } from '@/entities/transactions';
import { invalidateBudget, isActiveBudgetIdentity } from '@/shared/lib/budget-api';
import { hasValidMoneyPrecision } from '@/shared/lib/currency';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Typography } from '@/shared/ui/typography';

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [amount, setAmount] = useState(String(income.amount));
  const [description, setDescription] = useState(income.description ?? '');
  const [baseline, setBaseline] = useState({ amount: income.amount, description: income.description ?? '' });
  const pending = update.isPending || remove.isPending;
  const valid = Number(amount) > 0 && hasValidMoneyPrecision(Number(amount), income.currency);

  const close = () => {
    if (!pending) setMode(null);
  };

  const submit = async () => {
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
  };

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
    <>
      <Menu.Root>
        <Menu.Trigger
          ref={triggerRef}
          aria-label="Действия с доходом"
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
                label="Изменить"
                className="
                  flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none
                  data-highlighted:bg-accent
                "
                onClick={() => {
                  update.reset();
                  setAmount(String(income.amount));
                  setDescription(income.description ?? '');
                  setBaseline({ amount: income.amount, description: income.description ?? '' });
                  setMode('edit');
                }}
              >
                <LucidePencil size={16} />
                <span>Изменить</span>
              </Menu.Item>
              <Menu.Item
                label="Удалить"
                className="
                  flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm text-destructive outline-none
                  data-highlighted:bg-destructive/10
                "
                onClick={() => {
                  remove.reset();
                  setMode('delete');
                }}
              >
                <LucideX size={16} />
                <span>Удалить</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <ScrollDialog.Base open={mode === 'edit'} onOpenChange={(open) => !open && close()}>
        <ScrollDialog.Content finalFocus={triggerRef}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await submit();
            }}
          >
            <ScrollDialog.Layout
              title="Изменить доход"
              closeLabel="Закрыть"
              onClose={close}
              closeDisabled={pending}
              actions={(
                <div className="flex gap-2.5">
                  <Button.Icon
                    type="button"
                    aria-label="Назад"
                    title="Назад"
                    disabled={pending}
                    onClick={close}
                  >
                    <LucideArrowLeft />
                  </Button.Icon>
                  <Button.Base type="submit" disabled={pending || !valid}>
                    <LucideCheck />
                    {pending ? 'Сохранение…' : 'Сохранить'}
                  </Button.Base>
                </div>
              )}
            >
              <div>
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
                  hasError={!valid}
                />
                {!valid && <Input.Error role="alert">Укажите положительную сумму с точностью валюты.</Input.Error>}
              </div>
              <div>
                <Input.Label htmlFor={`income-description-${income._id}`}>Описание</Input.Label>
                <Input.Base
                  id={`income-description-${income._id}`}
                  value={description}
                  disabled={pending}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={1000}
                />
              </div>
              {update.isError && (
                <Typography.Caption1 className="text-destructive" role="alert">
                  Не удалось выполнить действие. Проверьте права и повторите.
                </Typography.Caption1>
              )}
            </ScrollDialog.Layout>
          </form>
        </ScrollDialog.Content>
      </ScrollDialog.Base>

      <AlertDialog.Base open={mode === 'delete'} onOpenChange={(open) => !open && close()}>
        <AlertDialog.Content
          className="max-w-sm"
          finalFocus={triggerRef}
          onBackdropClick={pending ? undefined : close}
        >
          <AlertDialog.Header>
            <AlertDialog.Title>Удалить доход?</AlertDialog.Title>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <AlertDialog.Description>Доход будет удалён, остаток счёта пересчитается.</AlertDialog.Description>
            {remove.isError && (
              <Typography.Caption1 className="text-destructive" role="alert">
                Не удалось выполнить действие. Проверьте права и повторите.
              </Typography.Caption1>
            )}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <AlertDialog.Close render={(
              <Button.Base
                type="button"
                variant="outline"
                disabled={pending}
              />
)}
            >
              Отмена
            </AlertDialog.Close>
            <Button.Base
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={submit}
            >
              {pending ? 'Удаление…' : 'Удалить'}
            </Button.Base>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Base>
    </>
  );
}
