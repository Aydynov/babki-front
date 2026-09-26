import i18next from 'i18next';
import { getCurrency } from 'locale-currency';
import { z } from 'zod';

export const currencyCodes = Intl.supportedValuesOf('currency').sort((left, right) => {
  if (left === 'RUB') return -1;
  if (right === 'RUB') return 1;
  return left.localeCompare(right);
});

const currencyCodeSet = new Set(currencyCodes);

export const currencyCodeSchema = z.string().refine(
  (value) => currencyCodeSet.has(value),
  'currency',
);

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const getCurrencyMinorUnits = (currency: CurrencyCode) => (
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCodeSchema.parse(currency),
  }).resolvedOptions().maximumFractionDigits ?? 2
);

const normalizeMoney = (amount: number, currency: CurrencyCode) => {
  const factor = 10 ** getCurrencyMinorUnits(currency);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
};

export const hasValidMoneyPrecision = (amount: number, currency: CurrencyCode) => (
  Number.isFinite(amount)
  && Math.abs(amount - normalizeMoney(amount, currency)) < Number.EPSILON * 10
);

export const formatMoney = (
  amount: number,
  currency: CurrencyCode,
  locale = i18next.language,
) => new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: currencyCodeSchema.parse(currency),
}).format(amount);

export const sortCurrencyCodes = (
  currencies: CurrencyCode[],
  defaultCurrency: CurrencyCode,
) => [...new Set(currencies)].sort((left, right) => {
  if (left === defaultCurrency) return -1;
  if (right === defaultCurrency) return 1;
  return left.localeCompare(right);
});

export const getCurrentCurrencyCode = (): CurrencyCode => currencyCodeSchema.parse(
  getCurrency(i18next.language) ?? 'RUB',
);
