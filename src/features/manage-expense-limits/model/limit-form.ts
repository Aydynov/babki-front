import { useBudgetScope } from '@/entities/budgets';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import { useForm } from '@tanstack/react-form';
import { emptyExpenseLimitFormValues } from './limit-draft';
import type {
  ExpenseLimitDraftErrors,
  ExpenseLimitDraftFieldError,
} from './validation';
import { getExpenseLimitFormSchema } from './validation';

export const useExpenseLimitForm = () => {
  const scope = useBudgetScope();
  return useForm({
    defaultValues: emptyExpenseLimitFormValues,
    validators: {
      onChange: getExpenseLimitFormSchema(scope.kind === 'group'),
    },
  });
};

export type ExpenseLimitFormApi = ReturnType<typeof useExpenseLimitForm>;

export const getExpenseLimitDraftErrors = (
  form: ExpenseLimitFormApi,
  index: number,
): ExpenseLimitDraftErrors => {
  const getFieldError = (
    field: `drafts[${number}].values.${'categoryId' | 'total'}`,
  ) => getFirstFieldError(form.getFieldMeta(field)?.errors ?? []) as
    ExpenseLimitDraftFieldError | undefined;

  return {
    categoryId: getFieldError(`drafts[${index}].values.categoryId`),
    total: getFieldError(`drafts[${index}].values.total`),
  };
};
