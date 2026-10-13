# Design

## Context

See `proposal.md` for motivation and the delta spec for behavior. `ExpensesByCategories` currently maps the configured category list directly, looking up each amount in the selected monthly-report currency bucket. That bucket already supplies the complete month's category totals; the widget also retains zero-expense categories.

## Goals / Non-Goals

**Goals:**
- Derive a display order from the selected month and currency while keeping category and report query data immutable.
- Make equal-amount ordering deterministic using the configured category-list order.

**Non-Goals:**
- Change category-management order, the monthly reports API, or sorting in other widgets.
- Add a sort control or persist a user preference.

## Decisions

- Build a category-ID-to-total lookup from the selected currency bucket, defaulting missing categories to zero, then sort a copied configured-category list by total descending. This avoids repeated report scans per row and prevents mutating TanStack Query data. Sorting the report's `expensesByCategory` array instead would omit configured categories with no expenses.
- Use the configured category index as the explicit tie-breaker. Relying only on engine sort stability would make that rule less visible; sorting by name would change the existing order for equal amounts.
- Derive the sorted rows from the current categories and selected bucket, for example with `useMemo`, so month or currency changes update the order without additional network requests or persisted state.

## Risks / Trade-offs

- [Reordered rows may briefly differ while queries update] → Derive amounts and order from the same selected bucket used for display, and retain the existing loading/error states.
- [A report may omit zero-expense categories] → Default missing totals to zero and keep every configured category in the sorted list.
