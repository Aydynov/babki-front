import { isAxiosError } from 'axios';
import i18next from 'i18next';
import type { CategoryDraftFieldError } from './validation';

export const isDuplicateCategoryError = (error: unknown) => (
  isAxiosError(error)
  && error.response?.status === 409
);

export const isLinkedExpenseCategoryError = (error: unknown) => (
  isAxiosError(error)
  && error.response?.status === 409
);

export const getCategoryMutationErrorMessage = (error: unknown) => {
  if (isLinkedExpenseCategoryError(error)) {
    return i18next.t('expenseCategories.management.errors.linkedExpenses');
  }

  return i18next.t('expenseCategories.management.errors.generic');
};

export const mapCategoryFieldError = (error: CategoryDraftFieldError | undefined) => {
  switch (error) {
    case 'required':
      return i18next.t('validation.required');
    case 'tooLong':
      return i18next.t('expenseCategories.management.validation.nameTooLong');
    case 'descriptionTooLong':
      return i18next.t('expenseCategories.management.validation.descriptionTooLong');
    case 'duplicate':
      return i18next.t('expenseCategories.management.validation.duplicateName');
    case 'invalidColor':
      return i18next.t('expenseCategories.management.validation.invalidColor');
    default:
      return undefined;
  }
};
