# Proposal

## Why

The current checkout repeats the daily expense, monthly report, and annual expense-category charts for each currency. A selector will let users inspect one currency at a time without needing conversion or comparing unlike amounts.

## What Changes

- Add an independent currency selector to each of three charts: daily expenses, monthly reports, and annual expenses by category.
- Show one currency at a time in each chart, using its original monetary values and formatting. Do not convert or combine currencies.
- Offer only currencies with plottable data for that chart and selected period. Keep a selection across period changes while it remains available; otherwise select the user's default currency when available, then the first available currency.
- Show an empty state within the chart card when no currency has plottable data. Keep other dashboard cards and progress indicators outside this change.
- For these three charts, replace the simultaneous-currency presentation specified by the completed `adapt-frontend-to-multicurrency-api` change. Its other dashboard requirements remain in effect.

## Capabilities

### New Capabilities

- `chart-currency-selection`: Currency-scoped rendering and independent selection for the three dashboard charts.

### Modified Capabilities

None. The prior simultaneous-currency rule exists in an unsynced change delta, not in `openspec/specs/`; this new capability explicitly narrows that rule for the three charts.

## Impact

- Frontend widgets: `expenses-by-days`, `expenses-by-months`, and `expenses-by-categories-annual`.
- Reuse the existing shared Select control and current validated expense, report, and user responses. No backend contract, currency-rate service, or dependency change is required.
- Update chart-specific tests and manually verify keyboard selection, loading, empty, error, and responsive layouts.
