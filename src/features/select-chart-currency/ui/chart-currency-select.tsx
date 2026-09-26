import type { CurrencyCode } from '@/shared/lib/currency';
import { Select } from '@/shared/ui/select';
import type { FC } from 'react';

interface ChartCurrencySelectProps {
  chartTitle: string;
  currencies: readonly CurrencyCode[];
  value: CurrencyCode | undefined;
  onChange: (currency: CurrencyCode) => void;
}

export const ChartCurrencySelect: FC<ChartCurrencySelectProps> = ({
  chartTitle,
  currencies,
  value,
  onChange,
}) => {
  if (!value) return null;

  return (
    <Select.Root
      value={value}
      onValueChange={(currency) => {
        if (currency) onChange(currency);
      }}
      disabled={currencies.length < 2}
    >
      <Select.Trigger aria-label={`Валюта графика «${chartTitle}»`} size="sm">
        <Select.Value>{value}</Select.Value>
      </Select.Trigger>
      <Select.Content>
        {currencies.map((currency) => (
          <Select.Item key={currency} value={currency}>{currency}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
