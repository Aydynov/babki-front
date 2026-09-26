import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  LucideMinus,
  LucidePlus,
  LucideX,
} from 'lucide-react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExpenseItemDraft } from '../model/expense-form';

interface ExpenseItemRowProps {
  item: ExpenseItemDraft;
  index: number;
  disabled: boolean;
  errors: {
    name?: string;
    quantity?: string;
    price?: string;
  };
  moneyStep: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onQuantityChange: (value: string) => void;
  onQuantityBlur: () => void;
  onPriceChange: (value: string) => void;
  onPriceBlur: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export const ExpenseItemRow: FC<ExpenseItemRowProps> = ({
  item,
  index,
  disabled,
  errors,
  moneyStep,
  onNameChange,
  onNameBlur,
  onQuantityChange,
  onQuantityBlur,
  onPriceChange,
  onPriceBlur,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const { t } = useTranslation();
  const itemNumber = index + 1;
  const quantity = Number(item.quantity);
  const decrementDisabled = disabled || !Number.isInteger(quantity) || quantity <= 1;

  return (
    <div
      className="
        grid min-w-0 gap-3 rounded-lg border p-3
        sm:grid-cols-[minmax(0,1fr)_11rem_9rem_auto] sm:items-start
      "
    >
      <div>
        <Input.Base
          value={item.name}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={onNameBlur}
          placeholder={t('expenses.create.fields.itemName')}
          aria-label={t('expenses.create.accessibility.itemName', { number: itemNumber })}
          hasError={Boolean(errors.name)}
          disabled={disabled}
        />
        {errors.name && <Input.Error>{errors.name}</Input.Error>}
      </div>

      <div className="min-w-0">
        <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] gap-1">
          <Button.Icon
            type="button"
            variant="outline"
            className="size-8"
            onClick={onDecrement}
            disabled={decrementDisabled}
            aria-label={t('expenses.create.accessibility.decrement', { number: itemNumber })}
          >
            <LucideMinus />
          </Button.Icon>
          <Input.Base
            className="h-8 min-w-0 px-2 text-center"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            value={item.quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            onBlur={onQuantityBlur}
            aria-label={t('expenses.create.accessibility.quantity', { number: itemNumber })}
            hasError={Boolean(errors.quantity)}
            disabled={disabled}
          />
          <Button.Icon
            type="button"
            variant="outline"
            className="size-8"
            onClick={onIncrement}
            disabled={disabled}
            aria-label={t('expenses.create.accessibility.increment', { number: itemNumber })}
          >
            <LucidePlus />
          </Button.Icon>
        </div>
        {errors.quantity && <Input.Error>{errors.quantity}</Input.Error>}
      </div>

      <div className="min-w-0">
        <Input.Base
          className="min-w-0"
          type="number"
          inputMode="decimal"
          min={moneyStep}
          step={moneyStep}
          value={item.price}
          onChange={(event) => onPriceChange(event.target.value)}
          onBlur={onPriceBlur}
          placeholder={t('expenses.create.fields.itemPrice')}
          aria-label={t('expenses.create.accessibility.itemPrice', { number: itemNumber })}
          hasError={Boolean(errors.price)}
          disabled={disabled}
        />
        {errors.price && <Input.Error>{errors.price}</Input.Error>}
      </div>

      <Button.Icon
        type="button"
        variant="ghost"
        className="size-8 justify-self-end text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={disabled}
        aria-label={t('expenses.create.accessibility.removeItem', { number: itemNumber })}
      >
        <LucideX />
      </Button.Icon>
    </div>
  );
};
