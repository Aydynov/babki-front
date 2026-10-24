import {
  CategorySelect,
  type CategorySelectOption,
  ExpenseCategoryBadge,
} from '@/entities/expense-categories';
import { Button } from '@/shared/ui/button';
import { getCurrencyMinorUnits } from '@/shared/lib/currency';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import {
  LucideCheck,
  LucideLoaderCircle,
  LucideUndo2,
  LucideX,
} from 'lucide-react';
import {
  type FC,
  type FormEvent,
  useId,
} from 'react';
import { useTranslation } from 'react-i18next';
import { mapExpenseLimitFieldError } from '../model/errors';
import type {
  ExpenseLimitDraft,
  ExpenseLimitDraftMutationError,
  ExpenseLimitDraftTouched,
} from '../model/limit-draft';
import { isExpenseLimitDraftDirty } from '../model/limit-draft';
import type {
  ExpenseLimitDraftErrors,
} from '../model/validation';
import { getExpenseLimitDraftValuesSchema } from '../model/validation';

interface ExpenseLimitRowProps {
  draft: ExpenseLimitDraft;
  categoryOptions: CategorySelectOption[];
  touched: ExpenseLimitDraftTouched;
  mutationError?: ExpenseLimitDraftMutationError;
  errors: ExpenseLimitDraftErrors;
  disabled: boolean;
  isSaving: boolean;
  categoryAvailable: boolean;
  onChange: (field: 'categoryId' | 'currency' | 'total', value: string) => void;
  onBlur: (field: 'categoryId' | 'currency' | 'total') => void;
  onDelete: () => void;
  onSave: () => void;
}

export const ExpenseLimitRow: FC<ExpenseLimitRowProps> = ({
  draft,
  categoryOptions,
  touched,
  mutationError,
  errors,
  disabled,
  isSaving,
  categoryAvailable,
  onChange,
  onBlur,
  onDelete,
  onSave,
}) => {
  const { t } = useTranslation();
  const categoryErrorId = useId();
  const totalErrorId = useId();
  const mutationErrorId = useId();
  const dirty = isExpenseLimitDraftDirty(draft);
  const canRestore = dirty && draft.baselineTotal !== null;
  const unavailableCategoryError = !draft.limitId
    && !draft.writeConfirmed
    && draft.values.categoryId
    && !categoryAvailable
    ? t('expenseLimits.management.validation.unavailableCategory')
    : undefined;
  const categoryError = mutationError?.field === 'categoryId'
    ? mutationError.message
    : unavailableCategoryError
      ?? (touched.categoryId
        ? mapExpenseLimitFieldError(errors.categoryId)
        : undefined);
  const totalError = touched.total
    ? mapExpenseLimitFieldError(errors.total)
    : undefined;
  const genericMutationError = mutationError?.field
    ? undefined
    : mutationError?.message;
  const isValid = getExpenseLimitDraftValuesSchema().safeParse(draft.values).success
    && !errors.categoryId
    && !errors.total
    && categoryAvailable
    && !mutationError?.field;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || !dirty || !isValid) return;
    onSave();
  };

  return (
    <form
      className="
        grid grid-cols-[32px_minmax(0,1fr)_32px] gap-x-1.5 gap-y-2
        sm:grid-cols-[minmax(0,1.25fr)_32px_minmax(5rem,0.75fr)_32px] sm:gap-y-1
      "
      aria-describedby={genericMutationError ? mutationErrorId : undefined}
      onSubmit={handleSubmit}
    >
      <div className="col-span-3 min-w-0 sm:col-span-1">
        {draft.limitId || draft.writeConfirmed ? (
          <div className="flex h-11 min-w-0 items-center overflow-hidden">
            {draft.category && (
              <ExpenseCategoryBadge color={draft.category.color}>
                {draft.category.name}
              </ExpenseCategoryBadge>
            )}
          </div>
        ) : (
          <CategorySelect
            options={categoryOptions}
            value={draft.values.categoryId}
            onValueChange={(value) => onChange('categoryId', value)}
            onBlur={() => onBlur('categoryId')}
            placeholder={t('expenseLimits.management.fields.category')}
            disabled={disabled}
            hasError={Boolean(categoryError)}
            describedBy={categoryError ? categoryErrorId : undefined}
          />
        )}
      </div>

      <div
        className="
          col-start-1 row-start-2 mt-1.5 flex size-8 items-center justify-center
          sm:col-auto sm:row-auto
        "
      >
        {dirty && (
          <Button.Icon
            type="submit"
            variant="ghost"
            className="size-8 text-success hover:bg-success/10 hover:text-success"
            aria-label={isSaving
              ? t('expenseLimits.management.actions.saving')
              : t('expenseLimits.management.actions.save')}
            aria-busy={isSaving || undefined}
            disabled={disabled || !isValid}
          >
            {isSaving
              ? <LucideLoaderCircle className="animate-spin motion-reduce:animate-none" />
              : <LucideCheck />}
          </Button.Icon>
        )}
      </div>

      <Input.Base
        id={`limit-total-${draft.key}`}
        type="number"
        inputMode="decimal"
        min={1 / (10 ** getCurrencyMinorUnits(draft.values.currency))}
        step={1 / (10 ** getCurrencyMinorUnits(draft.values.currency))}
        value={draft.values.total}
        onChange={(event) => onChange('total', event.target.value)}
        onBlur={() => onBlur('total')}
        placeholder={t('expenseLimits.management.fields.amount')}
        aria-label={t('expenseLimits.management.fields.amountLabel')}
        aria-invalid={Boolean(totalError) || undefined}
        aria-describedby={totalError ? totalErrorId : undefined}
        hasError={Boolean(totalError)}
        disabled={disabled}
        className="col-start-2 row-start-2 h-11 min-w-0 px-2 sm:col-auto sm:row-auto"
      />

      <Button.Icon
        type="button"
        variant="ghost"
        className="
          col-start-3 row-start-2 mt-1.5 size-8 sm:col-auto sm:row-auto
        "
        aria-label={t(canRestore
          ? 'expenseLimits.management.actions.restore'
          : 'expenseLimits.management.actions.delete')}
        onClick={() => {
          if (canRestore) onChange('total', String(draft.baselineTotal));
          else onDelete();
        }}
        disabled={disabled}
      >
        {canRestore ? <LucideUndo2 /> : <LucideX className="text-destructive" />}
      </Button.Icon>

      {categoryError && (
        <Typography.Caption1
          id={categoryErrorId}
          className="col-span-3 text-destructive sm:col-span-4"
          role="alert"
        >
          {categoryError}
        </Typography.Caption1>
      )}

      {totalError && (
        <Typography.Caption1
          id={totalErrorId}
          className="col-span-3 text-destructive sm:col-span-4"
          role="alert"
        >
          {totalError}
        </Typography.Caption1>
      )}

      {genericMutationError && (
        <Typography.Caption1
          id={mutationErrorId}
          className="col-span-3 text-destructive sm:col-span-4"
          role="alert"
        >
          {genericMutationError}
        </Typography.Caption1>
      )}
    </form>
  );
};
