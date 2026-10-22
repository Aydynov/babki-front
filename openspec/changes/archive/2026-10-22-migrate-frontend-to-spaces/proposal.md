# Proposal

## Why

Backend `cc8b4a6` unified finances under spaces and removed personal finance and group routes. The frontend still depends on those routes, financial profile defaults and legacy ownership DTOs, so authentication and financial workflows must be adapted together.

## What Changes

- **BREAKING**: Replace personal/group budget modes with one explicitly selected space; rename runtime group concepts, API paths, app routes and cache identity to space/spaceId.
- Introduce authenticated space selection and an empty-membership start screen offering creation or invitation acceptance; retain profile/session access without a space.
- **BREAKING**: Remove registration currency, user financial defaults, space type, legacy ownership fields and snapshot HTTP operations.
- Reuse existing finance screens with space DTOs, explicit account selection, actors, participant assignment/filtering, current permissions and archive restrictions.
- Use typed income/expense/transfer details and mutations, space plan execution and debt repayment/cancellation contracts, and currency-bucket reports with explicit historical ranges.
- Preserve existing dashboard composition, accessibility, pagination and responsive presentation; verify lifecycle failures and isolation between spaces.

## Capabilities

### New Capabilities

- `space-financial-contract`: Space-owned request/response validation, actor privacy, collection shapes and status-based financial error handling.

### Modified Capabilities

- `budget-context`: Space-only URL selection, onboarding, per-user preference and access recovery.
- `group-management`: Space directory, creation without type, setup, membership and delegation.
- `group-invitations`: Space endpoints, preview without type and activation from accept.spaceId.
- `group-accounts`: Accounts and historical balances scoped to a space.
- `group-financial-operations`: Unified space operations, participants, typed endpoints, permissions and aggregates.
- `group-plans`: Space ownership and execution with optional expense participant.
- `group-debts`: Unified debt and repayment lifecycle without personal compatibility paths.
- `user-authentication`: Registration and user contracts without financial defaults.
- `personal-account-management`: Apply existing account presentation/management to spaces and remove default account selection.
- `currency-aware-financial-operations`: Explicit active account selection, including savings, and server-owned debt remainder.
- `account-transfer-management`: Same-space transfers, authorization and scoped reconciliation.
- `account-details-dialog`: Permission-bound management without a default-account action.
- `accounts-widget-presentation`: Stable currency ordering independent of a profile default.
- `expense-creation`: Explicit space account and reconciliation without snapshot endpoints.
- `expense-editing`: Reconciliation through space account/history data.
- `expense-deletion`: Reconciliation through space account/history data.
- `multicurrency-dashboard-reporting`: Stable currency ordering and explicit UTC historical report ranges.
- `monthly-income-presentation`: Income description replaces the removed source field.
- `chart-currency-selection`: Chart-local selection without a profile-currency fallback.
- `monthly-expense-category-currency-view`: Category currency fallback without user financial defaults.
- `annual-summary-presentation`: Currency ordering and empty annual summaries without synthetic profile-currency rows.

Existing capability paths named `group-*` and `personal-account-management` are retained as specification identifiers, with their requirements updated to spaces. Runtime naming is migrated; archived changes are not rewritten.

## Impact

- Frontend: `src/app/routes`, `src/pages/main`, group management/invitation slices (to be renamed), budget context/helpers, financial entities and forms, auth/user schemas, account/history widgets, localization and colocated contract checks.
- Contract sources: `frontend-changelog-spaces.md`, `../babki-back/postman/specs/babki.openapi.json`, backend controllers and DTOs under `src/modules/spaces` and `src/modules/space-finances`, and auth/user DTOs.
- No backend implementation changes, data migration, new dependency, new global currency selector or dashboard redesign. Existing auth/TOTP/recovery behavior remains.
- Validation: strict OpenSpec validation now; lint, FSD architecture, production build, targeted executable checks and desktop/mobile manual verification during implementation. Preserve current uncommitted plan/debt/collection work.
