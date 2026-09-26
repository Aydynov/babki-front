## Context

See [proposal.md](./proposal.md) for motivation and the delta specs for observable behavior. The frontend currently
models `balance`, `saving`, and `save` as separate slices even though the updated backend has replaced them with unified
`accounts` and `transfers`. Most dashboard widgets assume a single locale-derived currency and directly consume the
legacy scalar report shape. Forms for expenses, incomes, plans, and debts also assume an implicit balance account.

The updated backend is a deliberate breaking change with no production-data compatibility requirement. It provides
strict DTO validation, immutable account and operation currencies, currency-specific precision, multiple accounts per
type, explicit account ids for account-affecting writes, and currency buckets for aggregate responses. The frontend
must preserve its Feature-Sliced Design dependency direction and its existing one-page responsive dashboard. Repository
validation has no general test runner; supported validation is lint, Steiger architecture lint, build, focused documented
`node:test` commands, and manual UI verification.

## Goals / Non-Goals

**Goals:**

- Establish one strict frontend contract model for currency, accounts, monetary effects, transfers, and currency buckets.
- Replace legacy account abstractions without carrying a compatibility adapter for removed endpoints.
- Make account and currency context explicit in every UI that displays or mutates money.
- Keep query-cache updates predictable across mutations that affect multiple accounts and aggregates.
- Preserve the current dashboard route and responsive composition while adding account and transfer management through
  widgets and dialogs.
- Make the migration implementable and verifiable in vertical slices so intermediate failures are localized.

**Non-Goals:**

- An authenticated setting or selector for changing `defaultCurrency`; that requires a separate UI-settings change.
- A dashboard-wide active-currency filter. All available currencies are presented simultaneously.
- Currency conversion, external exchange rates, net-worth aggregation, fees, or exchange gain/loss calculations.
- Dedicated account, transfer, profile, or settings routes.
- Compatibility with `/balances`, `/savings`, `/saves`, or legacy scalar report payloads.
- Changes to group-finance UI or backend behavior.

## Decisions

### 1. Replace legacy slices with canonical account and transfer entities

`entities/accounts` becomes the only source for personal account schemas, clients, query keys, and query options. Its
response schema includes identity metadata, `name`, `type`, `currency`, immutable opening fields, `archivedAt`, current
`amount`, and `timeline`. The client supports list filters, create, detail, rename, archive, and delete. Shared public APIs
and `@x` entry points expose only the account types and selectors needed by other entities.

A new `entities/transfers` slice owns paired source/destination effect schemas, the derived effective-rate response,
pagination, filters, and CRUD clients. The transaction discriminated union changes from `income | expense | save` to
`income | expense | transfer`, with transfer effects represented as a pair instead of forcing them into the scalar
transaction shape.

After all consumers move, `entities/balances`, `entities/savings`, `entities/saves`, and `features/create-save` are
removed. Keeping aliases or request adapters was considered, but rejected because it would preserve invalid assumptions
and create two cache-key namespaces for the same backend resources.

### 2. Centralize currency contracts and money behavior in `shared`

The shared currency module owns:

- a supported ISO-code schema and normalized currency type;
- the selectable currency catalog already used by registration;
- `Intl.NumberFormat`-based minor-unit lookup and formatting;
- reusable validation for positive or non-negative amounts at a currency's precision;
- deterministic ordering that places `defaultCurrency` first and then sorts by ISO code.

Every rendered amount receives currency explicitly. Existing amount-card and list primitives accept currency per value
or per row and no longer call a global locale-derived currency helper. Domain schemas remain responsible for whether an
amount is positive, optional, or immutable; shared helpers only encode currency-generic formatting and precision rules.

Duplicating precision refinements in each feature was considered, but rejected because it would drift for zero-minor-unit
and three-minor-unit currencies. Introducing a decimal library was also rejected: the backend wire format remains JSON
number, and this change must mirror rather than redefine its arithmetic contract.

### 3. Parse both outgoing DTOs and incoming responses at every changed API boundary

Each changed API module validates request bodies and query params before transport and parses response data with Zod
before returning it to TanStack Query. This applies to users/auth, accounts, snapshots, transactions, transfers, incomes,
expenses, limits, plans, debts, and reports. Entity schemas share nested primitives rather than duplicating ids, dates,
money effects, and currency buckets.

Legacy responses fail closed and surface through the widget or dialog error state. Permissive transitional unions were
considered, but rejected because they would conceal a mismatched backend deployment and could display unlike currencies
as one amount.

### 4. Use one accounts widget as the dashboard account-management boundary

`widgets/accounts` replaces the legacy balance and savings widgets. It displays active accounts in compact balance and
saving groups, preserves archived accounts in management/history context, and provides actions for account creation,
management, and transfers. Account mutations are implemented in focused features such as create/edit/lifecycle account
and manage transfer, while the widget only composes queries, presentation, and entry points.

Account creation defaults currency from the authenticated user, but does not expose a way to change the user's
`defaultCurrency`. The management dialog may mark a compatible active balance account as `defaultAccountId`; this is an
account choice, not a profile-currency setting. Transfer creation and history use their own dialog so multi-step transfer
state does not become coupled to account-row drafts.

Adding dedicated `/accounts` and `/settings` routes was considered, but rejected by the agreed single-dashboard scope.
Keeping separate Balance and Savings widgets was also rejected because multiple accounts of each type need one shared
lifecycle and transfer entry point.

### 5. Render multicurrency data as stable buckets inside existing widgets

Reports remain one request per period range. A small report view-model layer orders `currencies[]` by the authenticated
user's default currency and maps each bucket into the existing chart/list concepts. Amount cards render multiple labeled
currency rows; charts use a separate labeled series or compact section per currency; category and day/month breakdowns
never stack or sum values across currencies.

Income and expense lists may contain multiple currencies and therefore format every row from the transaction's stored
currency. Plans, debts, and limits likewise display each item's immutable currency rather than applying a page-level
currency. Empty state is evaluated per bucket or list, while a malformed shared response fails the owning widget as a
whole.

A global currency selector was considered and explicitly deferred as part of future UI settings. Showing only
`defaultCurrency` was rejected because it would hide valid user data. Converting to a common currency was rejected because
the backend intentionally supplies no conversion rates.

### 6. Reuse an account selector with operation-specific eligibility

An entity-level account selector receives loaded accounts plus an eligibility predicate and exposes name, type, amount,
currency, archived state, loading, empty, and error presentation. Features configure it as follows:

- income and new expense: any active personal account, defaulting to a valid `defaultAccountId`;
- plan closure: active account whose currency equals the plan currency;
- income-producing debt repayment: active account whose currency equals the debt currency;
- transfer: two different active accounts, with the destination excluding the selected source;
- default-account selection: active balance account in `defaultCurrency`.

Expense editing does not allow account changes because the backend update DTO does not accept `accountId`. Plans, debts,
and limits similarly keep currency immutable after creation. Centralizing eligibility prevents individual forms from
silently diverging on archived accounts or currency matching while leaving submission schemas feature-owned.

### 7. Separate server-confirmed cache writes from dependent reconciliation

Query keys remain in their owning entity modules. Mutation success handlers update or remove the directly returned
entity in matching cached lists/details, then invalidate dependent query families without awaiting those invalidations as
part of mutation success. A small feature-level invalidation helper may compose public query-key factories, but no entity
imports another entity's internal cache implementation.

Account-affecting mutations invalidate accounts and snapshots plus relevant transaction/report families. Transfer
mutations invalidate both account ids. Plan closure and income-producing debt repayment additionally invalidate their
owning plan or debt lists. This follows the existing successful expense-mutation pattern and prevents a failed refetch
from being reported as a failed write.

### 8. Preserve localized, responsive dialog behavior and explicit failure states

New UI copy remains Russian and enters the existing i18next resource structure. Dialogs disable conflicting actions
during mutations, retain entered values after retryable errors, restore focus to their trigger, and distinguish contract
errors, insufficient funds, deletion restrictions, loading failures, and generic transport failures. At narrow widths,
account and transfer rows stack monetary details rather than introducing horizontal page overflow.

The existing structural skeleton primitives remain the initial-loading state. Cached multicurrency content stays visible
during background refresh, and all required user/account/report data for a widget is treated as one readiness boundary.

## Risks / Trade-offs

- [The frontend currency catalog can drift from the backend runtime's `Intl.supportedValuesOf('currency')`] → Keep one
  shared frontend schema/catalog, reject unknown response codes, and include contract fixtures for the currencies used by
  backend seeds; document that adding supported currencies must update both applications.
- [A single migration touches most dashboard widgets and forms] → Implement in contract-first vertical slices, keep the
  legacy removal until the final consumer has moved, and run build/architecture checks after each slice.
- [Simultaneous currencies can make compact cards and charts visually dense] → Use currency-labeled rows or sections,
  stable ordering, and responsive stacking; verify RUB/USD seeded data at desktop and narrow widths.
- [Archived account history may outlive currently selectable accounts] → Preserve account ids and currency on financial
  entities, keep archived accounts available for labels, and exclude them only from new-operation eligibility.
- [Broad invalidation may increase request volume] → Invalidate by owning query-family prefixes and account-specific keys;
  optimize only after correctness is verified.
- [Backend contracts are currently present as uncommitted work in the adjacent repository] → Treat the inspected
  `../babki-back` working tree and its multicurrency OpenSpec artifacts as the source for this change, and re-audit DTOs
  immediately before implementation if the backend changes again.
- [The repository lacks one supported comprehensive test command] → Add focused contract/form/cache tests using existing
  patterns, run only documented focused test commands, and report the test-runner limitation alongside lint, architecture,
  build, and manual verification.

## Migration Plan

1. Re-audit the adjacent backend DTOs, response builders, controllers, and multicurrency OpenSpec artifacts for drift.
2. Add shared currency/money primitives, update user responses from `currency` to `defaultCurrency`, map the
   registration form's `defaultCurrency` to the backend request field `currency`, and add
   `defaultAccountId`.
3. Rebuild the accounts entity and account-management UI, then migrate account selectors into expense and income flows.
4. Add transfers and replace save creation/history while preserving paired-account cache reconciliation.
5. Update limits, plans, debts, transactions, snapshots, revenue summaries, and reports to their currency-aware schemas.
6. Replace legacy dashboard widgets with the accounts widget and bucket-aware report/list presentations.
7. Remove all obsolete balance/saving/save slices and imports, update translations, and regenerate only files owned by
   their generators.
8. Run focused tests, `npm run lint`, `npm run lint:architecture`, `npm run build`, and manual desktop/mobile verification
   against the seeded backend for loading, empty, error, archived, same-currency, and cross-currency scenarios.

This is a coordinated frontend/backend deployment with no legacy API fallback. Rollback requires deploying the previous
frontend together with the previous backend and recreating the development database from the matching seeds.
