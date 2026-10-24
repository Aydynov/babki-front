import { useCanManageRecord } from '@/entities/budgets';
import { AccountSelect, useAccountsQueryOptions } from '@/entities/accounts';
import {
  type Transfer,
  useCreateTransferMutation,
  useDeleteTransferMutation,
  useUpdateTransferMutation,
} from '@/entities/transfers';
import { formatMoney, getCurrencyMinorUnits } from '@/shared/lib/currency';
import { AlertDialog } from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { ScrollDialog } from '@/shared/ui/scroll-dialog';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useQuery } from '@tanstack/react-query';
import {
  LucideArrowRightLeft, LucidePencil, LucidePlus, LucideTrash2,
} from 'lucide-react';
import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDefaultTransferFormValues,
  getEligibleTransferDestinations,
  getTransferEffectiveRate,
  getTransferSubmissionIssue,
  isInsufficientTransferFundsError,
  mapCreateTransferDto,
  mapUpdateTransferDto,
  syncTransferDestinationAmount,
  type TransferFormValues,
  transferFormSchema,
} from '../model/transfer-form';

interface TransferFormDialogProps {
  open: boolean;
  initialValues: TransferFormValues;
  transfer?: Transfer;
  pending: boolean;
  error?: string;
  insufficientFundsError?: boolean;
  onClose: () => void;
  onSubmit: (values: TransferFormValues) => Promise<void>;
}

const TransferFormDialog: FC<TransferFormDialogProps> = ({
  open,
  initialValues,
  transfer,
  pending,
  error,
  insufficientFundsError = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const accountsQuery = useQuery(useAccountsQueryOptions().findAll());
  const [values, setValues] = useState(initialValues);
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const source = accounts.find(({ _id }) => _id === values.sourceAccountId);
  const destination = accounts.find(({ _id }) => _id === values.destinationAccountId);
  const sourceName = source?.name ?? transfer?.source.accountId;
  const destinationName = destination?.name ?? transfer?.destination.accountId;
  const destinationAccounts = getEligibleTransferDestinations(accounts, values.sourceAccountId);
  const issue = getTransferSubmissionIssue(
    values,
    source,
    destination,
    transfer?.source.amount,
    Boolean(transfer),
    false,
  );
  const schemaValid = transferFormSchema.safeParse(values).success;
  const effectiveRate = getTransferEffectiveRate(values.sourceAmount, values.destinationAmount);
  const sameCurrency = source?.currency !== undefined && source.currency === destination?.currency;
  const update = (patch: Partial<TransferFormValues>) => setValues((current) => ({
    ...current,
    ...patch,
  }));

  const submit = async () => {
    if (!schemaValid || issue) return;
    try {
      await onSubmit(values);
    } catch {
      // Mutation state keeps the retryable error visible.
    }
  };

  return (
    <ScrollDialog.Base open={open} onOpenChange={(next) => !next && !pending && onClose()}>
      <ScrollDialog.Content className="max-w-xl">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <ScrollDialog.Layout
            title={transfer ? t('transfers.form.editTitle') : t('transfers.form.createTitle')}
            closeLabel={t('transfers.form.close')}
            onClose={onClose}
            closeDisabled={pending}
            actions={(
              <Button.Base
                type="button"
                disabled={pending || !schemaValid || Boolean(issue)}
                onClick={submit}
              >
                <LucideArrowRightLeft />
                {pending ? t('transfers.form.saving') : t('transfers.form.save')}
              </Button.Base>
            )}
          >
            {transfer ? (
              <div className="rounded-lg border bg-muted/40 p-3 text-body-2">
                <div>
                  {sourceName}
                  {' → '}
                  {destinationName}
                </div>
                <div>
                  {formatMoney(transfer.source.amount, transfer.source.currency)}
                  {' → '}
                  {formatMoney(transfer.destination.amount, transfer.destination.currency)}
                </div>
                <div>{new Date(transfer.transactionDate).toLocaleDateString('ru-RU')}</div>
                <Typography.Caption1 className="text-muted-foreground">
                  {t('transfers.form.immutableContext')}
                </Typography.Caption1>
              </div>
            ) : (
              <>
                <dl className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-body-2">
                  <dt className="text-muted-foreground">{t('transfers.form.sourceAccount')}</dt>
                  {source && (
                  <dd className="shrink-0 font-medium tabular-nums">
                    {formatMoney(source.amount, source.currency)}
                  </dd>
                  )}
                </dl>
                <AccountSelect
                  id="transfer-destination-account"
                  accounts={destinationAccounts}
                  value={values.destinationAccountId}
                  onValueChange={(destinationAccountId) => {
                    const nextDestination = accounts.find(({ _id }) => _id === destinationAccountId);
                    update({
                      destinationAccountId,
                      destinationAmount: syncTransferDestinationAmount(
                        values.sourceAmount,
                        values.destinationAmount,
                        source?.currency,
                        nextDestination?.currency,
                      ),
                    });
                  }}
                  label={t('transfers.form.destinationAccount')}
                  placeholder={t('transfers.form.destinationPlaceholder')}
                  emptyMessage={t('transfers.form.destinationEmpty')}
                  disabled={pending || !values.sourceAccountId}
                />
              </>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input.Label htmlFor="transfer-source-amount">{t('transfers.form.sourceAmount')}</Input.Label>
                <Input.Base
                  id="transfer-source-amount"
                  placeholder="0.00"
                  type="number"
                  min={source ? 1 / (10 ** getCurrencyMinorUnits(source.currency)) : 0.01}
                  step={source ? 1 / (10 ** getCurrencyMinorUnits(source.currency)) : 0.01}
                  value={values.sourceAmount}
                  disabled={pending}
                  onChange={(event) => update({
                    sourceAmount: event.target.value,
                    destinationAmount: syncTransferDestinationAmount(
                      event.target.value,
                      values.destinationAmount,
                      source?.currency,
                      destination?.currency,
                    ),
                  })}
                />
                {insufficientFundsError && (
                <Input.Error>{t('transfers.errors.insufficientFunds')}</Input.Error>
                )}
              </div>
              <div>
                <Input.Label htmlFor="transfer-destination-amount">
                  {t('transfers.form.destinationAmount')}
                </Input.Label>
                <Input.Base
                  id="transfer-destination-amount"
                  placeholder="0.00"
                  type="number"
                  min={destination ? 1 / (10 ** getCurrencyMinorUnits(destination.currency)) : 0.01}
                  step={destination ? 1 / (10 ** getCurrencyMinorUnits(destination.currency)) : 0.01}
                  value={values.destinationAmount}
                  disabled={pending || sameCurrency}
                  onChange={(event) => update({ destinationAmount: event.target.value })}
                />
              </div>
            </div>

            {!transfer && (
            <div>
              <Input.Label htmlFor="transfer-date">{t('transfers.form.date')}</Input.Label>
              <Input.Base
                id="transfer-date"
                placeholder={t('transfers.form.datePlaceholder')}
                type="date"
                value={values.transactionDate}
                disabled={pending}
                onChange={(event) => update({ transactionDate: event.target.value })}
              />
            </div>
            )}
            <div>
              <Input.Label htmlFor="transfer-description">{t('transfers.form.description')}</Input.Label>
              <Input.Base
                id="transfer-description"
                placeholder={t('transfers.form.descriptionPlaceholder')}
                value={values.description}
                maxLength={1000}
                disabled={pending}
                onChange={(event) => update({ description: event.target.value })}
              />
            </div>

            {effectiveRate && source && destination && source.currency !== destination.currency && (
            <Typography.Caption1 className="text-muted-foreground">
              1
              {' '}
              {source.currency}
              {' '}
              =
              {' '}
              {effectiveRate.toLocaleString('ru-RU')}
              {' '}
              {destination.currency}
            </Typography.Caption1>
            )}
            {issue && (
            <Typography.Caption1 className="text-destructive" role="alert">
              {issue === 'insufficientFunds' && t('transfers.errors.insufficientFunds')}
              {issue === 'precision' && t('transfers.errors.precision')}
              {issue === 'sameCurrencyAmounts' && t('transfers.errors.sameCurrencyAmounts')}
              {issue === 'accountUnavailable' && t('transfers.errors.accountUnavailable')}
            </Typography.Caption1>
            )}
            {error && !insufficientFundsError && (
            <Typography.Caption1 className="text-destructive" role="alert">{error}</Typography.Caption1>
            )}
          </ScrollDialog.Layout>
        </form>
      </ScrollDialog.Content>
    </ScrollDialog.Base>
  );
};

export const CreateTransferButton: FC<{ initialSourceAccountId?: string }> = ({ initialSourceAccountId }) => {
  const { t } = useTranslation();
  const accountsQuery = useQuery(useAccountsQueryOptions().findAll());
  const mutation = useCreateTransferMutation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const sourceAccountId = accountsQuery.data?.find((account) => (
    account._id === initialSourceAccountId && account.archivedAt === null
  ))?._id ?? '';

  return (
    <>
      <Button.Icon
        type="button"
        aria-label={t('transfers.actions.create')}
        disabled={accountsQuery.isLoading || !accountsQuery.data}
        onClick={() => {
          mutation.reset();
          setSession((value) => value + 1);
          setOpen(true);
        }}
      >
        <LucidePlus />
      </Button.Icon>
      {open && (
        <TransferFormDialog
          key={session}
          open
          initialValues={getDefaultTransferFormValues(sourceAccountId)}
          pending={mutation.isPending}
          error={mutation.isError ? t('transfers.errors.create') : undefined}
          insufficientFundsError={isInsufficientTransferFundsError(mutation.error)}
          onClose={() => !mutation.isPending && setOpen(false)}
          onSubmit={async (values) => {
            await mutation.mutateAsync(mapCreateTransferDto(values));
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export const EditTransferButton: FC<{ transfer: Transfer }> = ({ transfer }) => {
  const allowed = useCanManageRecord(transfer.createdBy);
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const archived = accounts.data?.some((a) => (a._id === transfer.source.accountId
    || a._id === transfer.destination.accountId) && a.archivedAt !== null);
  const { t } = useTranslation();
  const mutation = useUpdateTransferMutation();
  const [open, setOpen] = useState(false);
  const initialValues: TransferFormValues = {
    sourceAccountId: transfer.source.accountId,
    destinationAccountId: transfer.destination.accountId,
    sourceAmount: String(transfer.source.amount),
    destinationAmount: String(transfer.destination.amount),
    transactionDate: transfer.transactionDate.slice(0, 10),
    description: transfer.description ?? '',
  };

  if (!allowed || archived) return null;
  return (
    <>
      <Button.Icon
        type="button"
        aria-label={t('transfers.actions.edit')}
        onClick={() => setOpen(true)}
      >
        <LucidePencil />
      </Button.Icon>
      {open && (
        <TransferFormDialog
          open
          transfer={transfer}
          initialValues={initialValues}
          pending={mutation.isPending}
          error={mutation.isError ? t('transfers.errors.update') : undefined}
          insufficientFundsError={isInsufficientTransferFundsError(mutation.error)}
          onClose={() => !mutation.isPending && setOpen(false)}
          onSubmit={async (values) => {
            await mutation.mutateAsync({ transferId: transfer._id, payload: mapUpdateTransferDto(values) });
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export const DeleteTransferButton: FC<{ transfer: Transfer }> = ({ transfer }) => {
  const allowed = useCanManageRecord(transfer.createdBy);
  const accounts = useQuery(useAccountsQueryOptions().findAll());
  const archived = accounts.data?.some((a) => (a._id === transfer.source.accountId
    || a._id === transfer.destination.accountId) && a.archivedAt !== null);
  const { t } = useTranslation();
  const mutation = useDeleteTransferMutation();
  const [open, setOpen] = useState(false);
  if (!allowed || archived) return null;
  return (
    <>
      <Button.Icon
        type="button"
        aria-label={t('transfers.actions.delete')}
        onClick={() => setOpen(true)}
      >
        <LucideTrash2 />
      </Button.Icon>
      <AlertDialog.Base open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>{t('transfers.actions.deleteTitle')}</AlertDialog.Title>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <AlertDialog.Description>{t('transfers.actions.deleteDescription')}</AlertDialog.Description>
            {mutation.isError && <p role="alert">{t('transfers.errors.delete')}</p>}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <AlertDialog.Close render={<Button.Base variant="outline" disabled={mutation.isPending} />}>
              {t('transfers.actions.cancel')}
            </AlertDialog.Close>
            <Button.Base
              variant="destructive"
              disabled={mutation.isPending}
              onClick={async () => {
                try {
                  await mutation.mutateAsync({
                    transferId: transfer._id,
                    sourceAccountId: transfer.source.accountId,
                    destinationAccountId: transfer.destination.accountId,
                  });
                  setOpen(false);
                } catch {
                  // Keep the confirmation open for retry.
                }
              }}
            >
              {mutation.isPending ? t('transfers.actions.deleting') : t('transfers.actions.confirmDelete')}
            </Button.Base>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Base>
    </>
  );
};
