# Tasks

## 1. Auth and shared contract foundation

- [x] 1.1 Remove registration currency and user financial defaults from `features/auth`, `entities/users` and profile payloads; update focused auth contract checks to accept users without defaults and assert registration sends no currency while password/TOTP/recovery destinations remain valid.
- [x] 1.2 Add the shared actor response schema with retained userId, nullable names and isAnonymized; verify an anonymized actor renders «Удалённый пользователь» without recovering a name from cached users or members.
- [x] 1.3 Replace personal/group scope with mandatory userId/spaceId across budget context, path helpers and financial API/query signatures; verify URL/key checks reject absent or malformed space identity and no helper falls back to root financial paths.
- [x] 1.4 Update common error handling for statusCode and string/array messages, preserving current-session-only 401 behavior and empty 204 handling; verify representative 400/401/403/404/409/503 responses do not produce false mutation success.
- [x] 1.5 Start `verification.md` in this change with the frontend/backend contract source paths, focused check commands and baseline limitations; verify documented invocations actually run and preserve pre-existing plan/debt/collection edits in the working diff.

## 2. Space directory, administration and invitations

- [x] 2.1 Rename groups entity/page/management/invitation slices, public exports, props and cache keys to spaces; use `/spaces` and `/space-invitations` endpoints, then verify request serialization and FSD imports contain no legacy group API references.
- [x] 2.2 Replace space schemas with id/name/description/ownerId/role/permissions and creation without type; verify create, rename, description clearing, pagination and permissions responses against backend fixtures without requiring space._id.
- [x] 2.3 Rename `_authenticated.groups*` routes and links to `/spaces`, `/spaces/new` and `/spaces/$spaceId`; run Vite to regenerate the route tree and verify directory, create and detail navigation without manual edits to generated files.
- [x] 2.4 Adapt membership, ownership, leave and delete flows to spaces; verify all four delegation flags stay independent, previous-owner rights reset after transfer, confirmations remain and success updates directory/settings/selection together.
- [x] 2.5 Update invitation preview to name/expiresAt and acceptance to spaceId/role; verify token-only JSON bodies, fragment removal, tab-local lifetime, no preview cache, no automatic POST retries and shared Retry-After blocking for preview/accept.
- [x] 2.6 Verify the invitation workflow for a user with zero spaces, including login/register/TOTP return to `/join`, 400 after successful preview and 409 for an existing member; record focused checks and any API verification evidence in `verification.md`.

## 3. Selection boundary and context transitions

- [x] 3.1 Change dashboard search parsing to `/main?spaceId=...` with digit-only ObjectId preservation, URL priority and per-user preference restoration; verify malformed/repeated IDs, stale personal preferences, missing storage, reload and browser history.
- [x] 3.2 Add authenticated space selection and no-membership onboarding without mounting finance queries; verify total=0 offers creation/invitation, nonzero-total empty pages recover pagination, and profile/security/logout remain available.
- [x] 3.3 Activate returned spaces after create/accept and provide resumable first-account setup without seeded accounts/categories; verify a single-member space follows the same flow and an invitation never requires prior space creation.
- [x] 3.4 Reset context-local form/reference/filter/page state on switching while preserving month/year, dirty-form confirmation and pending-mutation blocking; verify late reads and mutation results update only their original user/space.
- [x] 3.5 Reconcile 403/404 access changes through current space details and membership lists; verify revoked permissions preserve session/form state, a missing record does not evict an accessible space, last-space loss returns to selection, and network/503 failures retain preference.
- [x] 3.6 Record focused isolation and selection checks in `verification.md`; verify they cover switching between two spaces and between two authenticated identities, including aborting obsolete reads.

## 4. Account, category and limit contracts

- [x] 4.1 Consolidate financial response schemas around `_id`/spaceId and actual array/pagination shapes; update accounts/categories/limits clients and verify no financial request sends legacy ownership or author fields.
- [x] 4.2 Remove default-account badges/actions and all defaultCurrency/defaultAccountId consumers from account and operation forms; verify account creation keeps explicit currency, balance/saving type, empty amount mapped to zero and rename sends only name.
- [x] 4.3 Apply manageAccounts/manageCategories/manageLimits independently throughout account/category/limit controls and empty states; verify a member can read references without settings actions or automatic permission grants.
- [x] 4.4 Replace snapshot HTTP callers with account timeline and complete space ledger reads; verify historical month boundaries, before-open zero, negative balances and multi-page histories, then remove unused snapshot API/query code while retaining needed timeline types.
- [x] 4.5 Preserve archived references in dictionaries and restrict financial mutations on archived accounts; verify 204 archives keep balances/history/report effects and 409 deletion conflicts preserve records and offer the permitted alternative.
- [x] 4.6 Update colocated account/ledger/contract checks and record their executable commands and results; verify scope, currency precision and archive behavior against representative space responses.

## 5. Operations, participants and permissions

- [x] 5.1 Consolidate income/expense/transfer DTOs and forms under the space contract, replacing income source with optional description; verify explicit active balance/saving selection, immutable PATCH fields, currency minor units and dates before account opening.
- [x] 5.2 Replace generic transaction detail/delete calls with type-specific income/expense/transfer endpoints, retaining `/transactions` only for lists; verify all three dispatch paths and debt-origin income restrictions.
- [x] 5.3 Add optional expense participant selection, participant filtering and authorized reassignment using all current member pages; verify omitted participant defaults, author/participant distinction, former-member history and preservation of an unchanged assignment.
- [x] 5.4 Apply the action matrix separately for owner, author, expense participant and manageTransactions; verify participant-only editing does not permit reassignment, settings flags do not grant foreign-record actions and revoked rights refresh after 403.
- [x] 5.5 Update same-space transfer selectors and existing operation invalidation to the captured space scope; verify same/cross-currency amounts, either-side account history, archived-side blocking and no automatic duplicate after lost responses.
- [x] 5.6 Add focused serialized-request/action-matrix checks and record results in `verification.md`; verify account/transaction/report/limit/history reconciliation stays scoped and a failed refresh does not turn confirmed mutation success into failure.

## 6. Plans, debts and repayment history

- [x] 6.1 Remove personal/group plan unions and ownership branches; adapt space create/update/close/archive while preserving user presentation edits, then verify immutable currency, optional close participant, one-time execution and planned-versus-actual amount retention.
- [x] 6.2 Consolidate debt create/update schemas without writable remainingAmount/status, support dueDate:null only for clearing the debt deadline and block principal changes after any history; verify ordinary and cancelled repayment histories both enforce the restriction.
- [x] 6.3 Migrate debt-transaction APIs/types/UI to `/repayments` and typed details with required isIncome; verify true requires a same-space/same-currency active account and false omits accountId entirely.
- [x] 6.4 Apply `{ debt, repayment }` responses for repayment and cancellation together, preserve cancellation actors and prevent direct linked-income mutation; verify empty cancel body/query, repeat-cancel 409, archive restrictions and financial/noncash reconciliation.
- [x] 6.5 Serialize includeArchived as true/false text and preserve full pagination for plan/debt/repayment lists; verify archived details remain readable without mutation controls and record focused workflow checks in `verification.md`.

## 7. Reports, currency presentation and copy

- [x] 7.1 Use monthly report income buckets for all income totals, with explicit selected/previous-month UTC ranges; verify January-versus-December comparisons and absence of any income-revenue API request.
- [x] 7.2 Reuse the historical-year loader for spaces, including archived account opening dates; verify no missing/duplicate years, empty-account results and the backend UTC-year-difference limit of 100 with at most 101 annual buckets per request.
- [x] 7.3 Remove profile-currency ordering/fallbacks from accounts, income rows and reports; verify ISO ordering, independent currencies, preserved chart controls, totalRevenue=null handling and currencies=[] without synthetic money rows.
- [x] 7.4 Preserve income preview/dialog presentation using description, and offer explicit-account income creation when no currency rows exist; verify missing description labels, full pagination and permission-aware no-account guidance.
- [x] 7.5 Update Russian space terminology and targeted report/presentation checks; record command results and verify no active UI copy still implies personal/group modes, family/organization types or a default account.

## 8. Integration and delivery verification

- [x] 8.1 Run `npm run lint`, `npm run lint:architecture` and `npm run build`; record exact results and resolve migration regressions without claiming unsupported general test coverage.
- [x] 8.2 Run `npm run dev` and manually verify auth/selection/directory/join/dashboard routes on desktop and 320px/mobile, covering loading, empty, error and responsive states; store sanitized screenshots and outcomes in this change.
- [x] 8.3 Exercise representative finance flows against the maintained backend contract using disposable local simulation or isolated test spaces: create/select two spaces, account/income/expense/transfer, plan close, financial/noncash repayment, cancellation, archive, permission revocation and membership loss; distinguish simulated/live evidence and explicitly record unavailable checks.
- [x] 8.4 Review runtime source and network requests for root finance URLs, `/groups`, `groupId`, removed ownership/default fields, snapshots, `/incomes/revenue` and generic `/transactions/:id`; verify every remaining occurrence is intentional non-runtime history, a negative fixture or unrelated human ownership metadata.
- [x] 8.5 Run `openspec validate migrate-frontend-to-spaces --strict`, review task/spec coverage and finalize `verification.md` with evidence and remaining limitations; verify main specs/archived changes and pre-existing user work have not been unintentionally modified.

## Workflow follow-up

- Review the completed implementation and verification evidence before requesting sync/archive through the corresponding OpenSpec workflow.
