import type { CurrencyCode } from '@/shared/lib/currency';
import { Card } from '@/shared/ui/card';
import { ExpandIcon } from '@/shared/ui/expand-icon';
import { Body1, Body2, Typography } from '@/shared/ui/typography';
import { Collapsible } from '@base-ui/react';
import clsx from 'clsx';
import i18next from 'i18next';
import { LucideArrowDown, LucideArrowUp } from 'lucide-react';
import { type ComponentProps, type FC, type ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type DiffStyleType = 'percent' | 'currency';

type ClassNames<Keys extends string = string> = Partial<Record<Keys, string>>;

interface AmountItem {
  title?: string;
  date: string;
  value: number;
}

interface ICardAmountProps extends ComponentProps<typeof Card.Base> {
  title?: string;
  value: number;
  valueNotation?: Intl.NumberFormatOptions['notation'];
  currency: CurrencyCode;
  diff?: number;
  diffStyle?: DiffStyleType;
  classes?: ClassNames<'value'>;
  items?: AmountItem[];
  controls?: ReactNode;
}

interface ICardAmountSkeletonProps extends ComponentProps<typeof Card.Base> {
  title?: string;
  controls?: ReactNode;
  withDiff?: boolean;
}

export const CardAmountSkeleton: FC<ICardAmountSkeletonProps> = ({
  title,
  controls,
  withDiff = false,
  ...htmlProps
}) => (
  <Card.Base
    {...htmlProps}
    aria-busy="true"
    className={clsx('flex w-full min-w-0 max-w-xl flex-col gap-2.5 p-3.5', htmlProps.className)}
  >
    <span className="sr-only">Загрузка...</span>
    <div className="flex justify-between">
      {title && (
        <Typography.Title3 className="text-muted-foreground uppercase">
          {title}
        </Typography.Title3>
      )}
      {controls && <Card.Controls>{controls}</Card.Controls>}
    </div>
    <div className="flex justify-between items-end gap-2.5">
      <Skeleton className="h-6 w-32" />
      {withDiff && <Skeleton className="h-4 w-12" />}
    </div>
  </Card.Base>
);

export const CardAmount: FC<ICardAmountProps> = ({
  children,
  title,
  value,
  currency,
  valueNotation = 'compact',
  diff,
  diffStyle = 'percent',
  classes,
  items = [],
  controls,
  ...htmlProps
}) => {
  const locale = i18next.language;
  const isIncrease = !!diff && diff > 0;

  const formatAmount = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: valueNotation,
    minimumFractionDigits: 0,
  });

  const formatDiff = new Intl.NumberFormat(locale, {
    style: diffStyle,
    currency,
    signDisplay: 'exceptZero',
    notation: 'compact',
  });

  const DiffIcon = isIncrease ? LucideArrowUp : LucideArrowDown;

  return (
    <Collapsible.Root
      disabled={!items.length}
      render={(
        <Card.Base
          {...htmlProps}
          className={clsx('flex w-full min-w-0 max-w-xl flex-col gap-2.5 p-3.5', htmlProps.className)}
        />
      )}
    >
      <div className="flex justify-between">
        {title && (
          <Typography.Title3 className="text-muted-foreground uppercase">
            {title}
          </Typography.Title3>
        )}
        <Card.Controls>
          {controls}
          <Collapsible.Trigger hidden={!items.length} render={<Button.Icon />}>
            <ExpandIcon />
          </Collapsible.Trigger>
        </Card.Controls>
      </div>
      <Collapsible.Panel render={<div className="flex flex-col gap-2.5" />}>
        <div className="table">
          {items.map((item, index) => (
            <div key={`${item.date}-${index}`} className="table-row">
              {item.title && (
                <Body1 className="table-cell min-w-0 pb-2.5 font-semibold [&+.date]:text-right">
                  {item.title}
                </Body1>
              )}
              <Body2 className="date table-cell pb-2.5 whitespace-nowrap text-muted-foreground">
                {item.date}
              </Body2>
              <Body1 className="table-cell pb-2.5 w-25 text-right whitespace-nowrap">
                {formatAmount.format(item.value)}
              </Body1>
            </div>
          ))}
        </div>
        <Body1>всего:</Body1>
      </Collapsible.Panel>
      <div className="flex justify-between items-end gap-2.5">
        <Typography.SpecialBody1 title={value.toLocaleString()} className={classes?.value}>
          {formatAmount.format(value)}
        </Typography.SpecialBody1>
        {!!diff && (
        <Typography.Body2
          className={clsx(
            'flex items-center',
            isIncrease ? 'text-success' : 'text-destructive',
          )}
        >
          {formatDiff.format(diff)}
          <DiffIcon
            className="ml-1 size-4"
            strokeWidth={1.75}
          />
        </Typography.Body2>
        )}
      </div>
    </Collapsible.Root>
  );
};
