import { Debts } from '@/widgets/debts';
import { Accounts } from '@/widgets/accounts';
import { ExpensesByCategories } from '@/widgets/expenses-by-categories';
import { ExpenseLimits } from '@/widgets/expense-limits';
import { Expenses } from '@/widgets/expenses';
import { ExpensesByDays } from '@/widgets/expenses-by-days';
import { ExpensesByMonths } from '@/widgets/expenses-by-months';
import { ExpensesByAnnualCategories } from '@/widgets/expenses-by-categories-annual';
import { Incomes } from '@/widgets/incomes';
import { LastYearRest } from '@/widgets/last-year-rest';
import { Plans } from '@/widgets/plans';
import { YearExpenses } from '@/widgets/year-expenses';
import { YearIncomes } from '@/widgets/year-incomes';
import { YearSavings } from '@/widgets/year-savings';
import { Transfers } from '@/widgets/transfers';
import { MonthSwitcher, YearSwitcher } from '@/features/select-period';
import {
  LogoutButton,
  TwoFactorManagementDialog,
} from '@/features/auth';
import { Header } from '@/shared/ui/header';
import { HorizontalScroller } from '@/shared/ui/horizontal-scroller';
import { useMediaQuery } from '@/shared/lib/react';
import { useTranslation } from 'react-i18next';

export function MainPage() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 64rem)');
  const monthlySummary = (
    <div
      key="monthly-summary"
      className="
        grid min-w-0 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col
        [&>*]:max-w-none
        [&>*:last-child]:sm:col-span-2 [&>*:last-child]:md:col-span-1
      "
    >
      <Accounts />
      <Incomes />
    </div>
  );
  const monthlyReports = (
    <HorizontalScroller
      key="monthly-reports"
      aria-label="Отчёты за месяц"
      bleed="viewport-both"
      className="lg:col-span-2"
      role="region"
      trackClassName="gap-2.5 md:pb-2"
    >
      <ExpensesByDays />
      <ExpensesByCategories />
      <ExpenseLimits />
    </HorizontalScroller>
  );
  const monthlyExpenses = (
    <div key="monthly-expenses" className="flex min-w-0 flex-col gap-5">
      <Transfers />
      <Expenses />
    </div>
  );
  const monthlySections = isDesktop
    ? [monthlyReports, monthlyExpenses, monthlySummary]
    : [monthlySummary, monthlyReports, monthlyExpenses];

  return (
    <div className="flex min-w-0 flex-col gap-2.5 px-(--app-inline-padding)">
      <Header
        title={t('header.title')}
        subtitle={t('header.subtitle')}
        actions={(
          <>
            <TwoFactorManagementDialog />
            <LogoutButton />
          </>
        )}
      />

      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <YearSwitcher />
            <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <LastYearRest />
              <YearSavings />
              <YearIncomes />
              <YearExpenses />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <HorizontalScroller
              aria-label="Годовые отчёты"
              bleed="viewport-end"
              role="region"
              trackClassName="gap-5 md:pb-2"
            >
              <ExpensesByMonths />
              <ExpensesByAnnualCategories />
            </HorizontalScroller>
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <Plans />
              <Debts />
            </div>
          </div>
        </div>

        <MonthSwitcher />

        <div
          className="
            grid min-w-0 gap-5
            lg:grid-cols-[minmax(0,1fr)_minmax(auto,400px)] lg:gap-x-2.5
          "
        >
          {monthlySections}
        </div>
      </div>
    </div>
  );
}
