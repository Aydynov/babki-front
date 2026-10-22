# Design

## Context

See `proposal.md` for motivation and scope. Inspection found an existing cross-cutting budget layer:

- `shared/types/budget.ts` permits personal/group scopes; `shared/lib/budget-scope` chooses either root finance paths or `/groups/:groupId` and builds scoped cache keys.
- `entities/budgets` exposes context and permission helpers. `pages/main/ui/budget-main-page.tsx` reads `budget` search, restores a per-user preference and falls back to personal finances after group loss.
- `entities/groups`, `features/manage-groups`, `features/group-invitations`, `pages/groups` and `_authenticated.groups*` routes already implement most administration and invitation flows.
- Financial APIs/schemas branch between personal and group DTOs. Plans/debts require `ownerType/ownerId` in group responses; invitation preview requires `type`; accepted invitations require `groupId`.
- Auth/user schemas require removed financial defaults. Registration maps `defaultCurrency` to `currency`; account/income/expense/transfer forms consume profile defaults.
- Existing reporting already has currency buckets and a group-specific historical-year loader. Existing account ledger/history can be reused instead of adding snapshot HTTP endpoints.
- The current worktree includes user edits to plan/debt presentation and an untracked shared collection UI. Implementation must adapt around these changes without reverting them.

Contract evidence is the supplied changelog, backend OpenAPI at `../babki-back/postman/specs/babki.openapi.json`, and controllers/DTOs under backend `spaces`, `space-finances`, `auth` and `users`. The checked OpenAPI contains no legacy group, snapshot or income-revenue paths. No backend services were run during planning.

## Goals / Non-Goals

**Goals:** Use a single finance contract and a mandatory selected-space boundary; preserve existing FSD layering, page composition and monetary behavior; make invalid ownership/context combinations impossible to submit through normal UI; keep no-space users authenticated.

**Non-Goals:** Rebuild widgets, introduce a global currency setting, implement currency conversion, migrate financial data, change backend code or publish a Postman workspace. No additional package or separate generated API client is needed.

## Decisions

### 1. Reuse the selected-budget boundary with one space identity

Replace the discriminated personal/group scope with a required `{ userId, spaceId }`. Keep budget presentation concepts where they describe a budget, while renaming runtime group domain names, slices, exports, props, events and route parameters to spaces. Require scope in every financial API/query entry point; `budgetPath` must never silently produce a root financial URL. Query identity includes userId, spaceId and all relevant filters, pagination and period parameters. Mutation reconciliation retains its captured original scope.

This removes the main source of accidental legacy requests. Retaining a personal branch or merely replacing `/groups` with `/spaces` would leave invalid DTOs, hidden fallback requests and incompatible form behavior.

Rename public slice imports and `@x` APIs together to preserve downward FSD dependencies. A shared Actor schema belongs at the contract boundary in `shared/api`, without making financial entities depend on the users entity. Retain a local timeline data shape if still needed by account responses; remove unused snapshot HTTP clients, hooks and mutation paths after checking callers.

### 2. Explicit URL selection with a space-free authenticated shell

Use `/main?spaceId=<id>` for the existing dashboard and `/spaces`, `/spaces/new`, `/spaces/<spaceId>` for directory/create/settings. Preserve `/join` and authentication routes. Update file routes and let Vite regenerate `routeTree.gen.ts`.

`/main` resolves a saved preference only after identity and space access are confirmed, then replaces the URL with an explicit spaceId. Without a valid preference it shows the selector even if only one space exists. This preserves explicit selection and avoids silently guessing a space from list order. Digit-only ObjectIds must remain strings; malformed or repeated spaceId values show the selector without finance requests. Old `budget=personal` values and old preference storage are ignored; no legacy finance compatibility mode is provided.

Only mount the financial provider/tree after a space is validated. The selection/empty screen remains inside the authenticated shell with profile, logout and security access. A successful list with total=0 offers creation and invitation entry. A nonzero total with an empty page is pagination recovery, not onboarding. Creation and acceptance invalidate memberships, select the confirmed returned id and offer first-account setup without creating sample records.

On switching, preserve month/year, close old details/forms and clear account/category/plan/debt selections, participant filters and pagination; keep the existing dirty-form warning and pending-mutation guard. Cancel obsolete reads and use scoped keys so a late result cannot populate the new context. On confirmed space loss clear its active data and preference, refresh directory and show selection with an explanation. Recheck a financial 404 against space details before treating it as lost membership. Do not discard a preference on a network error or 503.

### 3. One strict outgoing DTO per endpoint

Space DTOs use `id`, name/description, ownerId, role and all four permissions, without type. Financial entities use `_id` and `spaceId`, plus server-returned author/origin data where defined. Remove legacy ownership requirements and personal/group unions. Validate outgoing payloads with endpoint-specific Zod schemas so removed/server-owned fields cannot leak from stale form objects. Validate responses and actual list envelopes without accepting invented fallback fields.

Registration has firstName/lastName/email/password only in the existing UI; the request contract may support optional notes without introducing a new control. User schemas and PATCH payloads remove financial defaults. Preserve password/TOTP/recovery flows and safe destinations.

Account creation keeps the existing clear form, empty initial amount mapped to zero, local opening-date suggestion, and explicit currency control. RUB is only a form suggestion, never an inferred budget currency. Account type defaults to balance in the form; rename sends only name. Income creation sends accountId/amount/transactionDate/optional description without source. Income and expense PATCH exclude immutable account/date/currency/author fields. Account and transaction type enums remain.

### 4. Account eligibility, participants and authorization

All operation selectors use the selected space's active accounts, allow balance and saving where the backend does, and enforce currency/precision/opening-date constraints. Income from an existing currency row retains that currency; a zero-currency empty state exposes creation with an explicit account selection. Never preselect a profile default. A source account already opened in account details remains the explicit transfer source.

Add optional participant selection to expense creation and plan execution, participant filtering to expenses, and authorized participant reassignment to expense editing. Load selectable current members beyond page one; preserve returned historical participant actors for former members. Leaving participantId omitted lets the server assign the author. Editing unrelated fields must preserve the current assignment.

Keep settings permissions independent: manageAccounts, manageCategories and manageLimits gate their settings; owner/manageTransactions/author gate ordinary record mutations; the current expense participant additionally edits/deletes that expense, but participant status alone does not permit reassignment. Debt actions follow the debt author's permissions. Read role/permissions from space DTOs, never infer own membership from a single member page. On 403 refresh the space and disable revoked actions while preserving recoverable form values and the session.

### 5. Reuse lifecycle workflows with typed financial resources

General transactions are a list only. Details, edits and deletions dispatch through incomes, expenses or transfers according to the record type. Origin-linked debt income routes to repayment history and cannot be independently mutated. Preserve ordinary expense rules for a plan's resulting expense.

Use one plan contract: no money reservation, immutable currency, one close creating one expense, optional participantId, and the planned amount retained separately. Use one debt contract: server-owned remainingAmount/status, principal immutable after any repayment history, and dueDate:null only where explicitly permitted. Repayments use required boolean isIncome, an eligible same-currency account only when true, and no accountId when false. Apply returned `{ debt, repayment }` together; cancellation sends no body/query fields and retains cancelled history.

Reuse existing archive and confirmation flows. A 204 resolves without JSON parsing. Archived account financial operations and archived plan/debt mutations remain unavailable, but history and currency totals remain readable. Keep archived categories/accounts in reference dictionaries. Do not infer cancellation success or repeat POST after 409, 503 or a lost response.

### 6. Currency buckets without a profile currency

Order currency sections by ascending ISO code, and accounts within type by currency, localized name and id. Preserve chart-specific currency selections and independent widget interactions; do not add a global selector. Income text uses description, with a neutral missing-description label.

Use the existing report bucket parsing and historical-account loader for every space. Selected months and comparisons always send explicit UTC boundaries, including previous December. Annual history starts at the earliest relevant account opening date, including archived accounts; split long histories into backend-valid ranges without overlap. The backend rejects a UTC-year difference greater than 100, so retain at most 101 inclusive annual buckets per request and test this boundary (space-reports.service.ts). Use monthly report income buckets instead of a nonexistent incomes/revenue endpoint. Treat expenses/revenue.totalRevenue=null as a multicurrency result, and currencies=[] as empty without inventing a profile/RUB total.

### 7. Error handling and verification artifacts

Keep the current authenticated 401 handling; classify other errors by HTTP/statusCode, supporting message strings and arrays. Invitation preview remains an explicit noncached request without polling/automatic retry; preview/accept share Retry-After handling. Preserve fragment-token extraction and tab-local lifetime.

Add focused executable contract/behavior checks using the existing colocated node:test approach where runnable, recording the exact invocation. Do not install a new runner or claim bare node --test is green. API verification should exercise the frontend against the maintained backend contract with a disposable local simulation or isolated test space, including permission changes and failures; report mocked and live evidence separately. Store the implementation check matrix, commands, outcomes and sanitized screenshots in this change's verification artifacts.

## Risks / Trade-offs

- [A partial rollout breaks authentication or silently calls removed routes] → Ship the frontend/backend contract migration together; statically search all API callers and assert representative serialized requests.
- [Old names in specification identifiers look inconsistent] → Keep existing capability paths for delta synchronization; describe space behavior inside them. Rename runtime slices and Russian UI copy, without rewriting archived history.
- [Broad schema changes conflict with user work] → Preserve and review existing plan/debt/collection edits; avoid unrelated presentation rewrites.
- [A stale response crosses spaces or identities] → Required scope, scoped query keys, abort signals, remounted context-local forms and scoped invalidation.
- [Historical ranges or partial ledgers produce incorrect totals] → Test UTC boundaries, complete pagination, negative balances, archive effects and report range limits; never substitute current amount or a guessed zero.
- [Adding participant controls extends an intentionally shared-only UI] → Expose only optional assignment/filtering supported by the new contract; totals remain space-wide and independent of authorship.
- [No configured general test runner or unavailable backend] → Use documented focused commands plus required lint/build and manual states; explicitly record any unverified live behavior.

## Migration Plan

1. Freeze the contract mapping from changelog/OpenAPI/backend DTOs and establish focused migration fixtures without real tokens or private URLs.
2. Migrate auth/user schemas and required space scope, then rename group slices, routes, queries and invitation contracts.
3. Add the space selection/no-membership boundary and access recovery before mounting migrated financial screens.
4. Consolidate financial DTOs and forms, typed operations, actors, participants and lifecycle mutations; remove obsolete branches and HTTP clients.
5. Update reports, currency ordering, empty states and original-space invalidation; preserve user presentation changes.
6. Run required repository checks, focused executable checks and manual desktop/mobile scenarios; record results and screenshots before declaring implementation complete.

Deploy with the matching spaces backend. There is no data migration or compatibility shim. Rollback requires restoring a compatible frontend/backend pair; reverting only the frontend against the spaces backend is not a functioning rollback. This planning change does not deploy, run finance mutations, commit user code or start implementation.
