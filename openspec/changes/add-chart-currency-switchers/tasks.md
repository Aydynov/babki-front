# Tasks

## 1. Shared chart currency control

- [x] 1.1 Add the `features/select-chart-currency` selection logic with focused tests for initial default, ISO fallback, retained choice, unavailable choice, and empty options; verify with its targeted `node --test` command.
- [x] 1.2 Add a compact, labeled currency selector using the shared Select parts, including the single-option disabled state; verify TypeScript build and keyboard behavior in an integrated chart.

## 2. Chart widgets

- [x] 2.1 Update `expenses-by-days` to offer currencies present in the selected month's expenses, render only the selected existing series, and show a card empty state when none are available; verify with a focused availability test and manual RUB/USD, single-currency, and empty-period checks.
- [x] 2.2 Update `expenses-by-months` to offer only currencies with a nonzero plotted metric, render one selected chart while preserving all five metrics and zero-filled months, and show a card empty state; verify with a focused availability test and manual currency-switch and empty-period checks.
- [x] 2.3 Update `expenses-by-categories-annual` to offer only currencies with positive category totals and render one selected pie, total, legend, and currency-formatted tooltip; verify with a focused availability test and manual currency-switch and empty-year checks.

## 3. Integration verification

- [x] 3.1 In `npm run dev`, verify that the three selectors work independently, preserve or fall back on period changes, support keyboard selection, and fit mobile and desktop widths; also check loading, error, and background-refresh states and confirm other dashboard widgets still show their existing currency sections.
- [x] 3.2 Run `npm run lint`, `npm run lint:architecture`, `npm run build`, all targeted chart-currency tests, and `git diff --check`; record any test-runner limits and resolve failures before marking the change implemented.
