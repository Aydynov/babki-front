import type {
  CategorySelectOption,
} from '@/entities/expense-categories';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import type { FC } from 'react';
import type {
  ExpenseLimitDraft,
  ExpenseLimitDraftMutationError,
} from '../model/limit-draft';
import type { ExpenseLimitFormApi } from '../model/limit-form';
import type {
  ExpenseLimitDraftErrors,
  ExpenseLimitDraftFieldError,
} from '../model/validation';
import { ExpenseLimitRow } from './expense-limit-row';

interface ExpenseLimitFormRowProps {
  form: ExpenseLimitFormApi;
  draft: ExpenseLimitDraft;
  index: number;
  categoryOptions: CategorySelectOption[];
  mutationError?: ExpenseLimitDraftMutationError;
  disabled: boolean;
  isSaving: boolean;
  categoryAvailable: boolean;
  onMutationErrorClear: (
    key: string,
    field: 'categoryId' | 'total',
  ) => void;
  onDelete: () => void;
  onSave: () => void;
}

export const ExpenseLimitFormRow: FC<ExpenseLimitFormRowProps> = ({
  form,
  draft,
  index,
  categoryOptions,
  mutationError,
  disabled,
  isSaving,
  categoryAvailable,
  onMutationErrorClear,
  onDelete,
  onSave,
}) => (
  <form.Field name={`drafts[${index}].values.categoryId`}>
    {(categoryField) => (
      <form.Field name={`drafts[${index}].values.total`}>
        {(totalField) => {
          const errors: ExpenseLimitDraftErrors = {
            categoryId: getFirstFieldError(categoryField.state.meta.errors) as
              ExpenseLimitDraftFieldError | undefined,
            total: getFirstFieldError(totalField.state.meta.errors) as
              ExpenseLimitDraftFieldError | undefined,
          };

          return (
            <ExpenseLimitRow
              draft={draft}
              categoryOptions={categoryOptions}
              touched={{
                categoryId: categoryField.state.meta.isTouched,
                total: totalField.state.meta.isTouched,
              }}
              mutationError={mutationError}
              errors={errors}
              disabled={disabled}
              isSaving={isSaving}
              categoryAvailable={categoryAvailable}
              onChange={(field, value) => {
                if (field !== 'currency') onMutationErrorClear(draft.key, field);
                if (field === 'categoryId') {
                  categoryField.handleChange(value);
                } else if (field === 'total') {
                  totalField.handleChange(value);
                } else {
                  form.setFieldValue(`drafts[${index}].values.currency`, value);
                }
              }}
              onBlur={(field) => {
                if (field === 'categoryId') {
                  categoryField.handleBlur();
                } else if (field === 'total') {
                  totalField.handleBlur();
                }
              }}
              onDelete={onDelete}
              onSave={onSave}
            />
          );
        }}
      </form.Field>
    )}
  </form.Field>
);
