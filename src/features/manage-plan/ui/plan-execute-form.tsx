import { useBudget, useBudgetPermission } from '@/entities/budgets';
import { spacesQueryOptions } from '@/entities/spaces';
import { type Plan, type useClosePlanMutation } from '@/entities/plans';
import { AccountSelect, useAccountsQueryOptions } from '@/entities/accounts';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Select } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { getCurrencyMinorUnits, hasValidMoneyPrecision } from '@/shared/lib/currency';
import { LucideArrowLeft, LucideCheck, LucideUndo2 } from 'lucide-react';
import { type FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  executePlanFormSchema,
  getEligiblePlanAccounts,
  getExecutePlanFormValues,
} from '../model/execute-plan-form';
import { getFirstFieldError, getMutationErrorMessage, mapErrorMessage } from '../model/errors';

interface PlanExecuteFormProps {
  plan: Plan;
  mutation: ReturnType<typeof useClosePlanMutation>;
  onCancel: () => void;
  onClose: () => void;
  onSuccess: () => void;
}

export const PlanExecuteForm: FC<PlanExecuteFormProps> = ({
  plan,
  mutation,
  onCancel,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const canCreateAccount = useBudgetPermission('manageAccounts');
  const { scope } = useBudget();
  const members = useQuery(spacesQueryOptions.allMembers(scope.userId, scope.spaceId));
  const mutationError = getMutationErrorMessage(mutation.error);
  const accountsQuery = useQuery(useAccountsQueryOptions().findAll());
  const eligibleAccounts = getEligiblePlanAccounts(accountsQuery.data ?? [], plan.currency);

  const participantOptions = [
    { value: scope.userId, label: t('plans.execute.participantDefault') },
    ...(members.data ?? []).filter((member) => member.userId !== scope.userId).map((member) => ({
      value: member.userId,
      label: [member.firstName, member.lastName].filter(Boolean).join(' ') || t('plans.execute.participantFallback'),
    })),
  ];
  const participantReadOnly = members.isSuccess && participantOptions.length === 1;
  const accountsUnavailable = !accountsQuery.isSuccess || eligibleAccounts.length === 0;
  const defaultAccountId = getExecutePlanFormValues(plan, accountsQuery.data).accountId;

  const form = useForm({
    defaultValues: getExecutePlanFormValues(plan, accountsQuery.isSuccess ? accountsQuery.data : []),
    validators: { onSubmit: executePlanFormSchema },
    onSubmit: async ({ value }) => {
      if (accountsUnavailable) return;
      if (!hasValidMoneyPrecision(Number(value.amount), plan.currency)) return;
      if (!eligibleAccounts.some((account) => account._id === value.accountId)) return;
      try {
        await mutation.mutateAsync({
          planId: plan._id,
          payload: {
            accountId: value.accountId,
            ...(value.participantId ? { participantId: value.participantId } : {}),
            closingDate: value.closingDate,
            amount: Number(value.amount),
            description: value.description.trim(),
          },
        });

        mutation.reset();
        onSuccess();
      } catch { /* Mutation errors are shown without discarding the draft. */ }
    },
  });

  useEffect(() => {
    if (!accountsQuery.isSuccess || mutation.isPending) return;
    const selectedId = form.getFieldValue('accountId');
    if (!eligibleAccounts.some((account) => account._id === selectedId) && selectedId !== defaultAccountId) {
      form.setFieldValue('accountId', defaultAccountId);
    }
  }, [accountsQuery.isSuccess, eligibleAccounts, defaultAccountId, form, mutation.isPending]);

  const clearMutationError = () => {
    if (mutation.isError) mutation.reset();
  };

  const handleReset = () => {
    clearMutationError();
    form.reset(getExecutePlanFormValues(plan, accountsQuery.isSuccess ? accountsQuery.data : []));
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <ScrollDialog.Layout
        title={t('plans.execute.title')}
        closeLabel={t('plans.execute.close')}
        onClose={onClose}
        closeDisabled={mutation.isPending}
        actions={(
          <div className="flex gap-2.5">
            <Button.Icon
              type="button"
              onClick={onCancel}
              disabled={mutation.isPending}
              aria-label={t('plans.details.backToView')}
              title={t('plans.details.backToView')}
            >
              <LucideArrowLeft />
            </Button.Icon>
            <Button.Icon
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={mutation.isPending}
              aria-label={t('plans.execute.reset')}
              title={t('plans.execute.reset')}
            >
              <LucideUndo2 />
            </Button.Icon>
            <Button.Base type="submit" disabled={mutation.isPending || accountsUnavailable}>
              <LucideCheck />
              {mutation.isPending ? t('plans.execute.executing') : t('plans.execute.confirm')}
            </Button.Base>
          </div>
        )}
      >
        <Dialog.Description>{t('plans.execute.description')}</Dialog.Description>
        <form.Field name="participantId">
          {(field) => (
            <div>
              <Input.Label htmlFor="execute-plan-participant">{t('plans.execute.fields.participant')}</Input.Label>
              {participantReadOnly ? (
                <Input.Base
                  id="execute-plan-participant"
                  value={t('plans.execute.participantDefault')}
                  readOnly
                />
              ) : (
                <Select.Root
                  items={participantOptions}
                  value={field.state.value || scope.userId}
                  disabled={mutation.isPending || members.isLoading || members.isError}
                  onValueChange={(value) => {
                    if (value !== null) {
                      clearMutationError();
                      field.handleChange(value === scope.userId ? '' : value);
                    }
                  }}
                >
                  <Select.Trigger
                    id="execute-plan-participant"
                    size="form"
                    onBlur={field.handleBlur}
                  >
                    <Select.Value placeholder={t('plans.execute.fields.participantPlaceholder')} />
                  </Select.Trigger>
                  <Select.Content>
                    {participantOptions.map((option) => (
                      <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
              {members.isError && <Input.Error>{t('plans.execute.errors.members')}</Input.Error>}
            </div>
          )}
        </form.Field>

        <form.Field name="accountId">
          {(field) => (
            <AccountSelect
              id="execute-plan-account"
              accounts={eligibleAccounts}
              value={field.state.value}
              onValueChange={(value) => {
                clearMutationError();
                field.handleChange(value);
              }}
              label={t('plans.execute.fields.account', { currency: plan.currency })}
              placeholder={t('plans.execute.fields.accountPlaceholder')}
              emptyMessage={t('plans.execute.errors.noAccounts', { currency: plan.currency })}
              isLoading={accountsQuery.isLoading}
              error={accountsQuery.isError ? t('plans.execute.errors.accounts') : undefined}
              disabled={mutation.isPending}
              offerAccountCreation={canCreateAccount}
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
            return (
              <div>
                <Input.Label htmlFor="execute-plan-description">
                  {t('plans.execute.fields.description', { currency: plan.currency })}
                </Input.Label>
                <Input.Base
                  id="execute-plan-description"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('plans.execute.fields.description')}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                  maxLength={500}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="amount">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));
            const precisionError = field.state.value
              && !hasValidMoneyPrecision(Number(field.state.value), plan.currency)
              ? `Сумма не соответствует точности валюты ${plan.currency}`
              : undefined;
            const error = fieldError ?? precisionError;

            return (
              <div>
                <Input.Label htmlFor="execute-plan-amount">
                  {t('plans.execute.fields.amountLabel', { currency: plan.currency })}
                </Input.Label>
                <Input.Base
                  id="execute-plan-amount"
                  name={field.name}
                  type="number"
                  inputMode="decimal"
                  min={1 / (10 ** getCurrencyMinorUnits(plan.currency))}
                  step={1 / (10 ** getCurrencyMinorUnits(plan.currency))}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  placeholder={t('plans.execute.fields.amount')}
                  hasError={Boolean(error)}
                  disabled={mutation.isPending}
                />
                {error && <Input.Error>{error}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="closingDate">
          {(field) => {
            const fieldError = mapErrorMessage(getFirstFieldError(field.state.meta.errors));

            return (
              <div>
                <Input.Label htmlFor="execute-plan-date">
                  {t('plans.execute.fields.closingDate', { currency: plan.currency })}
                </Input.Label>
                <Input.Base
                  id="execute-plan-date"
                  name={field.name}
                  type="date"
                  placeholder={t('plans.execute.fields.closingDate')}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  hasError={Boolean(fieldError)}
                  disabled={mutation.isPending}
                />
                {fieldError && <Input.Error>{fieldError}</Input.Error>}
              </div>
            );
          }}
        </form.Field>

        {mutationError && (
          <Typography.Caption1 className="text-destructive">{mutationError}</Typography.Caption1>
        )}
      </ScrollDialog.Layout>
    </form>
  );
};
