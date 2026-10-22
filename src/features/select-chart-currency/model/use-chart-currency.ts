import type { CurrencyCode } from '@/shared/lib/currency';
import { useEffect, useState } from 'react';
import { resolveChartCurrency } from './resolve-chart-currency';

export const useChartCurrency = (
  available: readonly CurrencyCode[] | undefined,
) => {
  const [requestedCurrency, setRequestedCurrency] = useState<CurrencyCode>();
  const selectedCurrency = available === undefined
    ? undefined
    : resolveChartCurrency(requestedCurrency, available);

  useEffect(() => {
    if (available !== undefined && requestedCurrency !== selectedCurrency) {
      setRequestedCurrency(selectedCurrency);
    }
  }, [available, requestedCurrency, selectedCurrency]);

  return [selectedCurrency, setRequestedCurrency] as const;
};
