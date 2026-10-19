import { useQuery } from '@tanstack/react-query';
import { useAccountsQueryOptions } from '@/entities/accounts';
import { useIncomesQueryOptions } from '@/entities/incomes';
import type { GroupRepayment } from '@/entities/debt-transactions';
import type { useCancelDebtRepaymentMutation } from '@/entities/debts';
import { Typography } from '@/shared/ui/typography';
import { ConfirmActionButton } from './confirm-action-button';

interface RepaymentCancelButtonProps {
  debtId: string;
  repayment: GroupRepayment;
  mutation: ReturnType<typeof useCancelDebtRepaymentMutation>;
}

export const RepaymentCancelButton = ({ debtId, repayment, mutation }: RepaymentCancelButtonProps) => {
  const income = useQuery({
    ...useIncomesQueryOptions().findOne(repayment.incomeId ?? ''),
    enabled: repayment.isIncome && Boolean(repayment.incomeId),
    retry: false,
  });
  const account = useQuery({
    ...useAccountsQueryOptions().findOne(income.data?.accountId ?? ''),
    enabled: repayment.isIncome && Boolean(income.data?.accountId),
    retry: false,
  });
  const financialBlocked = repayment.isIncome && (!account.isSuccess || Boolean(account.data.archivedAt));
  return (
    <>
      {financialBlocked && (
        <Typography.Caption1>
          {account.data?.archivedAt ? 'Отмена недоступна: счёт архивирован.'
            : 'Для финансовой отмены требуется доступный активный счёт.'}
        </Typography.Caption1>
      )}
      <ConfirmActionButton
        description="Отменить погашение? Остаток долга будет восстановлен, поступление компенсировано."
        pending={mutation.isPending}
        disabled={financialBlocked}
        onConfirm={() => mutation.mutateAsync({ debtId, repaymentId: repayment._id })}
      >
        Отменить
      </ConfirmActionButton>
    </>
  );
};
