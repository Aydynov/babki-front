import { reportsQueryOptions } from '@/entities/reports';
import { Card } from '@/shared/ui/card';
import { Typography } from '@/shared/ui/typography';
import { Menu } from '@base-ui/react';
import { useQuery } from '@tanstack/react-query';
import { LucideChevronUp } from 'lucide-react';
import { type FC, useRef } from 'react';
import classes from './year-switcher.module.css';
import { usePeriodStore } from '../model/store';

interface YearSwitcherViewProps {
  value: number;
  onChange?: (value: number) => void;
  allowedYears: number[];
}

const YearSwitcherView: FC<YearSwitcherViewProps> = ({
  value,
  onChange,
  allowedYears = [],
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnotherYears = allowedYears.length > 1;

  return (
    <Card.Base ref={cardRef} className="flex w-full min-w-0 px-4 py-5 lg:w-2xs">
      <Menu.Root>
        <Menu.Trigger className={classes.trigger} disabled={!hasAnotherYears}>
          <Typography.SpecialBody2>
            {value}
            {' '}
            год
          </Typography.SpecialBody2>
          {hasAnotherYears && (
            <LucideChevronUp className="transition-transform duration-100" size={20} />
          )}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            anchor={cardRef}
            collisionAvoidance={{ side: 'none', align: 'none' }}
            sideOffset={-10}
          >
            <Menu.Popup
              className="flex min-w-(--anchor-width) flex-col rounded-t-none border-t-0 p-1 shadow-xl"
              render={<Card.Base />}
            >
              <Menu.RadioGroup value={value} onValueChange={onChange}>
                {allowedYears.map((year) => (
                  <Menu.RadioItem
                    key={year}
                    value={year}
                    className={classes.popupItem}
                    render={<Typography.Body2 />}
                    closeOnClick
                  >
                    {year}
                    {' '}
                    год
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Card.Base>
  );
};

export const YearSwitcher: FC = () => {
  const { data: yearReports } = useQuery(reportsQueryOptions.yearly());
  const allowedYears = yearReports
    ?.map(({ period }) => Number(period))
    .sort((a, b) => b - a) ?? [];
  const selectedYear = usePeriodStore((state) => state.selectedYear);
  const setSelectedYear = usePeriodStore((state) => state.setSelectedYear);

  return (
    <YearSwitcherView
      value={selectedYear}
      onChange={setSelectedYear}
      allowedYears={allowedYears}
    />
  );
};
