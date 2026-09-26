## Why

The frontend still assumes one implicit balance account, one saving account, one currency, and legacy `/balances`,
`/savings`, and `/saves` endpoints. The backend now exposes multiple named, currency-denominated accounts, explicit
account selection for financial operations, atomic transfers, and currency-grouped reports, so the current dashboard
can no longer represent or safely mutate the user's financial data.

## What Changes

- **BREAKING**: replace the legacy balance, saving, and save client contracts with unified personal accounts and
  transfers.
- Add account management to the existing dashboard: list balances and savings by currency, create and rename accounts,
  set a compatible default account, and archive or delete accounts with lifecycle-aware feedback.
- Add transfer creation and management for same-currency and cross-currency account movements.
- Require an explicit compatible account when creating incomes and expenses, closing plans, or repaying debts.
- Add immutable currency selection to expense limits, plans, and debts and display monetary values with their currencies.
- Change reports and revenue summaries to consume currency buckets without summing or comparing unlike currencies.
- Update user contracts to use `defaultCurrency` and `defaultAccountId`; keep `defaultCurrency` in the registration form
  while mapping it to the backend registration field `currency`; keep the existing registration
  currency control, but defer authenticated profile-currency settings to a future change.
- Preserve the current single-dashboard navigation model by exposing account and transfer actions through widgets and
  dialogs rather than adding dedicated routes.
- Remove obsolete frontend entities, features, cache keys, and UI that depend on the removed backend endpoints.

## Capabilities

### New Capabilities

- `personal-account-management`: Dashboard presentation and lifecycle management for multiple named balance and saving
  accounts in different currencies.
- `account-transfer-management`: Creation, listing, editing, and deletion of atomic same- and cross-currency transfers.
- `multicurrency-dashboard-reporting`: Currency-separated dashboard totals, histories, and reports with no implicit
  conversion or cross-currency aggregation.
- `currency-aware-financial-operations`: Account and currency selection rules for incomes, plans, debts, and their
  account-affecting actions.

### Modified Capabilities

- `user-authentication`: Registration now requires a supported default currency and validates the updated auth response.
- `expense-creation`: Expense creation requires an active account and validates monetary precision in that account's
  currency.
- `expense-editing`: Existing expenses display their account and currency while retaining an immutable account during
  editing.
- `expense-limit-management`: Limits are created and presented within an explicit immutable currency scope.
- `widget-loading-states`: Multicurrency widgets preserve stable loading, empty, error, and background-refresh states
  while coordinating account and currency-bucket queries.

## Impact

- Reworks entity schemas and API/query modules for users, accounts, transactions, transfers, incomes, expenses, expense
  limits, plans, debts, snapshots, and reports.
- Removes the legacy `balances`, `savings`, and `saves` slices and replaces their consumers and cache invalidation rules.
- Adds account and transfer management features and updates existing forms to choose compatible accounts or currencies;
  an authenticated `defaultCurrency` selector is explicitly deferred.
- Changes every monetary dashboard widget to format values with ISO 4217 currency metadata and render separate currency
  buckets.
- Updates Russian UI copy and i18next resources while preserving Feature-Sliced Design boundaries and the existing
  responsive dashboard layout.
- Requires contract-focused schema tests, affected form/cache tests, repository lint and architecture checks, a
  production build, and manual verification against the updated backend.
