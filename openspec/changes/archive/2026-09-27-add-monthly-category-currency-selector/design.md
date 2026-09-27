# Design

## Context

See `proposal.md` for the motivation and `specs/monthly-expense-category-currency-view/spec.md` for the behavior contract. The monthly widget currently reads expenses, categories, and the authenticated user's default currency, then renders one full category list per currency. The daily and annual charts already use `useChartCurrency` for local selection and `ChartCurrencySelect` for a compact header control. The monthly widget sits in a horizontal scroller, so header width and card height matter on narrow screens.

## Goals / Non-Goals

**Goals:**

- Reuse the existing selection fallback behavior while keeping monthly category selection local to its widget.
- Read category totals from monthly reports while keeping zero-value category rows, per-currency percentage calculation, and loading/error presentation.
- Give the selector a label that accurately identifies the monthly category breakdown.

**Non-Goals:**

- Add a dashboard-wide currency setting, conversion rates, or a cross-currency total.
- Change the daily, monthly report, or annual chart selection behavior.
- Filter out zero-value categories or change category management.

## Decisions

### Reuse local currency-selection state

The widget will select the current month's bucket from the monthly reports response and offer only currency buckets whose `expenses` total is positive. The API includes buckets for account currencies even when they have no expenses, so these must be excluded. `useChartCurrency` preserves an available choice and falls back to the user's default or the first ISO-sorted available code. The widget will wait for the authenticated user's settings before committing its initial choice, so a temporary RUB fallback cannot override a later user default. A month with no positive expense bucket produces no selected currency.

An independent widget-specific selection hook was considered, but it would duplicate the chart fallback logic. A global selector was rejected because this card's choice must not change unrelated widgets.

### Render one selected currency's rows

The widget will use the selected report currency's `expensesByCategory` values and its `expenses` total as the percentage denominator, then render the existing configured category rows once. A category missing from the report bucket gets zero. The selector will sit in `Card.Controls` beside the category-management button; the repeated currency heading and outer currency loop will disappear. When there are no expenses, the card will show its empty state while preserving the header and management control. Existing loading and recoverable error behavior will continue to gate the content.

Keeping collapsible sections was considered, but it would retain repeated category lists and a variable-height card. Converting values to one currency was rejected because the available expense data has no conversion-rate contract.

### Reuse the year-to-date monthly reports query

The widget will use the same monthly reports date range as the existing "Расходы по месяцам" chart: the start of the selected year through the selected month for the current year, or through year end for a past year. This lets TanStack Query share the cached response. It will find the selected `yyyy-MM` period inside that response. The reports API already aggregates all expenses by category without the expense-list pagination limit. Expense mutations invalidate report queries through the existing `reports` key. The widget will show its existing query error if the report cannot load.

### Give the reused control an accurate accessible label

Reuse `ChartCurrencySelect` for the visual control and keyboard behavior, with an optional accessible-label override for the monthly category widget. Existing chart call sites keep their current labels. The one-currency state remains visibly identified by a disabled control, matching the chart pattern. The header layout will be checked at the widget's narrowest supported width.

A separate selector implementation inside the widget was considered, but it would duplicate the shared control and increase the chance of inconsistent keyboard or disabled behavior.

## Risks / Trade-offs

- [The feature and control names are chart-specific although the widget uses progress rows] → Reuse their behavior with a precise accessible-label override; consider broader renaming only if another non-chart consumer appears.
- [Two header controls may crowd narrow cards] → Verify the card in the horizontal scroller at mobile width and adjust header spacing or wrapping without hiding either action.
- [Changing months while data loads may briefly expose stale selection] → Derive available currencies only from the selected month in the current report result and retain the existing skeleton for uncached periods.
- [Monthly reports include zero-expense account currencies] → Filter buckets by positive `expenses` before offering currencies or showing category rows.
