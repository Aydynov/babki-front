# Proposal

## Why

The monthly expense-category card currently follows the order returned by the category list, so the largest expenses can be hard to spot. Ordering rows by the selected month's spending makes the breakdown easier to scan.

## What Changes

- Sort category rows by expense amount from highest to lowest for the selected month and currency.
- Keep configured categories with zero expenses visible after categories with expenses; preserve category-list order for equal amounts.
- Recompute the order when the selected month, currency, report totals, or configured categories change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monthly-expense-category-currency-view`: Define the order of category rows within the existing currency-scoped monthly breakdown.

## Impact

- Monthly `ExpensesByCategories` widget rendering and its focused sorting verification.
- No API contract, dependency, or currency-selection changes; sorting uses the monthly reports data already loaded by the widget.
