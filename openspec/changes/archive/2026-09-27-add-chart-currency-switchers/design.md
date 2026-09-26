# Design

## Context

See `proposal.md` for motivation and `specs/chart-currency-selection/spec.md` for observable behavior. In the current checkout, each of the three target widgets renders one chart per currency. Daily expenses come from the expense list, the monthly bar chart from report periods, and the annual category pie from yearly report buckets. The shared `Select` primitive and card header controls already exist. The completed `adapt-frontend-to-multicurrency-api` change requires simultaneous currencies, but its reporting delta has not been synced to the main specs; this change supersedes that rule only for these three charts.

## Goals / Non-Goals

**Goals:**
- Keep each chart's currency state local and independent, with the same selection and fallback behavior in all three widgets.
- Render one chart per widget and keep labels, tooltips, and totals tied to the selected currency.
- Keep the card geometry and controls usable during loading, empty, error, and narrow-screen states.

**Non-Goals:**
- Persist chart currency choices across reloads or synchronize them with other widgets.
- Change report or expense API contracts, add exchange rates, or recalculate the existing daily series.
- Add selectors to category progress bars, limit progress bars, amount cards, or transaction lists.

## Decisions

### 1. Share the interaction, keep data filtering in each widget

Create a small `features/select-chart-currency` slice with a local selection hook and an accessible selector composed from the existing shared `Select` parts. Each widget supplies its own available currency codes and authenticated default currency. The feature resolves the current choice: retain it if available, otherwise choose the default if available, otherwise the first ISO-sorted option. When the old choice disappears, update local state to the resolved choice so it cannot unexpectedly reappear in a later period. An empty list yields no selection.

This keeps the same state rules in one place while respecting FSD boundaries (`widgets -> features -> shared`). A dashboard-wide store would couple three independent choices. Repeating state logic in all three widgets would make fallback behavior easy to diverge.

### 2. Define availability from plotted data

- Daily expenses: use currencies present in expense records for the selected month. Keep the existing per-currency date/amount mapping and ordering; select one mapped series instead of rendering the entire list.
- Monthly reports: use currencies with at least one nonzero expense, income, saving, transfer-in, or transfer-out value in the displayed year-to-date/full-year range. Select one result of the existing `getMonthlyCurrencySeries` view model; retain its zero-filled periods so the chosen chart keeps the current month axis.
- Annual categories: use currencies with at least one positive category expense total for the selected year. Select one of the existing prepared pie sections; its center total and tooltip use that section's currency.

The report helpers may return a default-currency placeholder or zero-only buckets; those are not selectable because they cannot plot activity. A selector listing all account currencies would offer empty charts, contrary to the agreed scope.

### 3. Place the control in each chart header

Put the compact selector in `Card.Controls` beside the title, with an accessible label identifying the chart. When only one currency is available, show it as a disabled single-option control. When none is available, show an empty state within the card and no selected currency; the annual pie already has an empty state, while the daily and monthly charts need one. Reserve enough header space during loading to avoid a noticeable layout shift. Keep the chart's own legend for metrics/categories; remove a legend whose only purpose is to list multiple currencies.

Using the existing Select parts avoids a new UI dependency and provides keyboard operation. A row of currency tabs would consume more width in the dashboard scrollers and grow unpredictably with additional currencies.

### 4. Preserve request and error boundaries

Changing currency filters already-fetched validated data and does not initiate a new request. Period changes still use the current query keys. A full query failure retains the widget's existing recoverable error state; a background refresh with usable cached data retains the rendered chart until the new data arrives. No previous-period values are presented as the new period's values.

## Risks / Trade-offs

- [A selected currency vanishes when the period changes] -> Resolve the fallback in the shared feature and verify that all three widgets behave identically.
- [Report buckets with zero values appear selectable] -> Compute availability from plotted metrics or positive category totals, not from bucket presence alone.
- [Selectors crowd narrow card headers] -> Use the compact shared control and verify each card at mobile and desktop widths.
- [The old reporting delta conflicts with this chart-specific rule] -> Keep the explicit supersession in the proposal and new spec; leave other simultaneous-currency widgets unchanged.

## Migration Plan

This is a frontend-only presentation change with no stored data migration. Rollback restores the previous chart renderers and removes the selector feature; API responses and cache keys remain compatible.
