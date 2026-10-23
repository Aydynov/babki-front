import { Select } from '@/shared/ui/select';
import { cn } from '@/shared/lib/shadcn-utils';
import type { FC } from 'react';
import { ExpenseCategoryBadge } from './expense-category';

export interface CategorySelectOption {
  _id: string;
  name: string;
  color?: string;
  isArchived?: boolean;
}

interface CategorySelectProps {
  options: CategorySelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  describedBy?: string;
}

export const CategorySelect: FC<CategorySelectProps> = ({
  options,
  value,
  onValueChange,
  onBlur,
  placeholder,
  disabled,
  hasError,
  describedBy,
}) => {
  const selected = options.find((option) => option._id === value);
  const activeOptions = options.filter((option) => !option.isArchived);

  return (
    <Select.Root
      items={activeOptions.map((option) => ({ value: option._id, label: option.name }))}
      value={value}
      onValueChange={(next) => onValueChange(next ?? '')}
      disabled={disabled}
    >
      <Select.Trigger
        size="form"
        onBlur={onBlur}
        className={cn(
          'overflow-hidden',
          hasError && [
            'border-destructive',
            'focus-visible:border-destructive focus-visible:ring-destructive/20',
          ],
        )}
        aria-label={placeholder}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
      >
        {selected ? (
          <ExpenseCategoryBadge color={selected.color}>{selected.name}</ExpenseCategoryBadge>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Select.Trigger>

      <Select.Content>
        {activeOptions.map((option) => (
          <Select.Item key={option._id} value={option._id}>
            <ExpenseCategoryBadge color={option.color}>{option.name}</ExpenseCategoryBadge>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
