# Proposal

## Why

The monthly expense-category widget repeats the full category list for every currency, making the card tall and visually dense when a month contains multicurrency expenses. Users need a compact way to inspect each currency without combining unlike amounts.

## What Changes

- Show one currency's category breakdown at a time in the monthly widget, with a local currency selector in its header.
- Offer only currencies with expenses in the selected month; keep a valid selection across month changes and fall back predictably when it disappears.
- Show an empty state when the month has no expenses in any currency, while retaining the existing category rows, including zero-value rows, when a currency is selected.
- Keep the widget's selection independent of the dashboard charts and category-management control.

## Capabilities

### New Capabilities

- `monthly-expense-category-currency-view`: Currency selection, category values, and empty-state behavior for the monthly expense-category widget.

### Modified Capabilities

None.

## Impact

- Affects the monthly expense-category widget and may reuse or generalize the existing chart currency-selection primitives.
- Requires no API or financial data-model changes. The widget reads category totals from the existing monthly reports API, alongside category and user queries; it does not page through individual expenses.
- Supersedes the earlier multicurrency-dashboard design's simultaneous currency sections for this widget only; other dashboard cards and charts remain independently scoped.
