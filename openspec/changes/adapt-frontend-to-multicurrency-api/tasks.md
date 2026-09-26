## 1. Contract audit and currency foundation

- [x] 1.1 Re-audit the current `../babki-back` multicurrency DTOs, controllers, response builders, and OpenSpec artifacts and record any drift from this change before editing frontend code.
- [x] 1.2 Add focused failing tests for supported currency validation, minor-unit precision, explicit formatting, and default-first currency ordering.
- [x] 1.3 Implement the shared currency schema, money precision helpers, formatter, and ordering utility; replace locale-derived implicit currency helpers in shared primitives.
- [x] 1.4 Add failing user/auth contract tests for `defaultCurrency`, nullable `defaultAccountId`, and registration request mapping.
- [x] 1.5 Update user and authentication schemas, API parsing, registration payload mapping (`defaultCurrency` form value to backend `currency`), fixtures, and Russian copy without adding authenticated currency settings UI.

## 2. Unified personal account contracts

- [x] 2.1 Add failing account schema tests covering named balance/saving accounts, currency, opening fields, archive state, current amount, timeline, list filters, and create/rename payloads.
- [x] 2.2 Rebuild the accounts API and TanStack Query module for list, create, detail, rename, archive, delete, and stable query-key invalidation.
- [x] 2.3 Add focused tests for active-account eligibility, default-account eligibility, default selection, archived-account labeling, and currency-specific initial-amount validation.
- [x] 2.4 Implement reusable account presentation and selection UI through the accounts public API, including loading, empty, error, archived, and incompatible states.
- [x] 2.5 Implement account creation, rename, default selection, archive, and delete features with confirmations, lifecycle-specific errors, mutation locking, and cache reconciliation.
- [x] 2.6 Replace the legacy balance and savings dashboard cards with a responsive accounts widget that shows all account currencies at the selected period end date.

## 3. Explicit accounts for income and expense flows

- [x] 3.1 Add failing income and expense contract tests for stored currency, required create `accountId`, currency filters, currency-bucket revenue responses, and update payload immutability.
- [x] 3.2 Update income and expense entity schemas, API clients, response parsing, query keys, and account-aware invalidation behavior.
- [x] 3.3 Add failing expense-form tests for default-account initialization, explicit selection, unavailable accounts, archived-account editing context, and currency-specific amount/item precision.
- [x] 3.4 Update expense creation and editing UI to use the account selector, submit `accountId` only on creation, and display immutable account/currency context during editing.
- [x] 3.5 Update income creation UI to select an active account, submit `accountId`, format the resulting currency, and recover when no active account exists.

## 4. Atomic transfer workflows

- [x] 4.1 Add failing transfer schema and API tests for paired effects, effective rate, pagination and account filters, create/update payloads, and strict same-currency equality.
- [x] 4.2 Implement the transfers entity slice with Zod response parsing, API/query modules, public exports, and account-specific cache-key helpers.
- [x] 4.3 Add failing transfer-form tests for distinct-account eligibility, same-currency linked amounts, cross-currency independent precision, effective-rate preview, and insufficient-funds recovery.
- [x] 4.4 Implement transfer creation and editing dialogs with immutable account/date context during editing and responsive, accessible pending/error states.
- [x] 4.5 Implement transfer history and confirmed deletion UI, and refresh both account effects plus transaction, snapshot, and report families after successful mutations.

## 5. Currency-scoped limits, plans, and debts

- [x] 5.1 Add failing contract tests and update expense-limit schemas, queries, revenue parsing, and mutation payloads for immutable currency scope.
- [x] 5.2 Update expense-limit management drafts and rows so category uniqueness and monetary precision are evaluated per currency and persisted currencies remain read-only.
- [x] 5.3 Add failing plan contract/form tests and update plan schemas, list filters, creation currency, and close payload account selection.
- [x] 5.4 Update plan creation, editing, listing, and closure UI to format immutable currency and offer only matching active accounts during closure.
- [x] 5.5 Add failing debt contract/form tests and update debt schemas, list filters, immutable currency, and optional repayment `accountId` rules.
- [x] 5.6 Update debt creation, editing, listing, and repayment UI so income-producing repayments require a matching active account and non-income repayments do not.

## 6. Multicurrency transactions and dashboard reports

- [x] 6.1 Add failing transaction and snapshot contract tests for the `income | expense | transfer` union, account/currency filters, transfer effects, and archived account history.
- [x] 6.2 Update transaction and snapshot schemas, API parsing, query options, and cross-entity public APIs to the new account and transfer model.
- [x] 6.3 Add failing report tests for `currencies[]` periods, transfer-in/out totals, default-first ordering, zero-activity account currencies, and rejection of legacy scalar payloads.
- [x] 6.4 Update report schemas and implement currency-bucket view models for amount cards, category breakdowns, daily/monthly charts, and yearly summaries.
- [x] 6.5 Migrate income, expense, plan, debt, limit, and summary widgets to per-value currency formatting and simultaneous currency sections without a global selector.
- [x] 6.6 Verify each migrated widget preserves structural skeletons, stable empty geometry, accessible errors, cached content during refetch, and narrow-viewport behavior.

## 7. Legacy removal and integration cleanup

- [x] 7.1 Remove the balance, savings, and saves entity slices, the create-save feature, legacy widgets, and every `/balances`, `/savings`, or `/saves` reference after all consumers are migrated.
- [x] 7.2 Consolidate account/transfer cache invalidation through public query-key APIs and resolve all FSD cross-slice imports through public `index.ts` or approved `@x` entry points.
- [x] 7.3 Complete Russian i18next copy for accounts, transfers, currencies, precision, lifecycle restrictions, loading, empty, and retryable error states.
- [x] 7.4 Update focused fixtures and documented `node:test` commands for every touched colocated test without claiming unsupported repository-wide automated coverage.

## 8. Verification

- [x] 8.1 Run every documented focused contract, form, cache, and view-model test touched by the change and record exact results and test-runner limitations.
- [x] 8.2 Run `npm run lint`, `npm run lint:architecture`, and `npm run build`; fix all change-related failures and record exact results.
- [x] 8.3 Run the frontend with the updated seeded backend and manually verify registration plus RUB/USD account, income, expense, transfer, limit, plan, debt, report, archive, deletion-restriction, loading, empty, and error scenarios.
- [x] 8.4 Manually verify the affected dashboard and dialogs at desktop and approximately 320-pixel viewport widths, including keyboard navigation, focus restoration, accessible labels, and absence of horizontal page overflow.
- [x] 8.5 Re-run strict OpenSpec validation and reconcile proposal, design, delta specs, tasks, and verification notes with the implemented behavior before handoff.
