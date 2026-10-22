# Verification

## Contract and scope

- Frontend migration source: `frontend-changelog-spaces.md` (2026-10-22, backend reference `cc8b4a6`).
- Backend contract: `../babki-back/postman/specs/babki.openapi.json` and controllers/DTOs in `src/modules/{spaces,space-finances,auth,users}` of that repository.
- Frontend starting commit: `bcc049706694027eedaa5ebb91bf055e57ae3c1b`; implementation branch: `codex/migrate-frontend-to-spaces`.
- Initial user work: staged changelog; modified debt-details-dialog/debt-view/plan-view/debts widget/plans widget; untracked `src/shared/ui/collection/`. Preserve these edits while adapting contracts.
- No backend source edits or production mutations are authorized by these checks. Use synthetic identities and local test services only.

## Implementation

- Mandatory `{ userId, spaceId }` finance scope; URLs, caches, mutations and abort signals retain both identities.
- Spaces directory/settings/invitations/routes replace groups. Vite regenerated the route tree.
- Unified financial DTOs, actors, typed transaction resources, participants, permissions, archive and repayment workflows.
- Reports replace income-revenue requests; explicit UTC ranges, comma-separated categories and historical batches of at most 101 years.
- Explicit URL selection and confirmed per-user `babki.space.<userId>` preference; obsolete personal preferences ignored.
- No seeded finances. Registration, empty selection, first-account setup and invitation acceptance remain independent.
- Root integrated the three delegated domains. Delegated review subsequently became unavailable due to agent usage limits; final contract/source review was performed in the parent session.

## Executed focused checks

### Auth/user contract — task 1.1

Updated checks first failed on the old required defaultCurrency/defaultAccountId and currency registration mapping (five expected failures). After implementation:

```sh
node --test src/features/auth/model/auth-form.test.mjs src/entities/users/model/currency-contract.test.mjs src/features/auth/model/auth-response.test.mjs src/features/auth/model/two-factor-contracts.test.mjs src/features/auth/model/redirect.test.mjs src/features/auth/model/session-response.test.mjs
```

Result: 20 passed, 0 failed. Registration sends no financial fields even with obsolete form currency input; user responses accept absent financial defaults; profile changes reject removed fields; session identity, redirects and factor contracts retain their behavior.

### Shared actors — task 1.2

```sh
node --test src/shared/api/financial-actor.test.mjs
```

Result: expected red on missing shared contract, then 1 passed, 0 failed. Actor userId remains required; null names are accepted; anonymized labels ignore stale names. Existing author displays use the shared formatter, including repayment cancellation authors.

### API failures and empty success — task 1.4

```sh
node --test src/shared/api/errors.test.mjs src/shared/api/unauthorized-session.test.mjs
```

Result: expected red on generic Axios text hiding validation messages, then 7 passed, 0 failed. String/array backend messages are preserved, HTTP status takes precedence over payload statusCode, all tested financial error statuses remain rejected, 204 succeeds without JSON, and current-token-only 401 handling is preserved.

Targeted ESLint passed for the root's shared API/error changes. These are local unit/transport checks, not evidence from a live backend.

## Integration evidence (2026-10-22)

### Executable checks

- `npm run lint`: passed.
- `npm run lint:architecture`: passed, no FSD violations.
- `npm run build`: passed; Vite reports bundle chunks above 500 kB (size warning).
- Explicit colocated checks: `node --test` with all 67 paths returned by `rg --files src -g '*.test.mjs'` as arguments. 189 passed, 0 failed in the final rerun. This is a documented named-file invocation, not a configured general test runner or an `npm test` claim.
- Removed obsolete snapshot HTTP test with its removed client. Timeline and full-ledger checks remain in accounts/model tests; abort isolation remains in budget-invalidation and spaces API checks.
- Updated old fixtures to require spaceId/actors, immutable DTOs and income description. No compatibility response branches were added to satisfy obsolete fixtures.
- Member pagination additionally rejects an empty page with nonzero remaining total or changed totals rather than silently offering a partial participant list (RED/GREEN).
- Additional RED/GREEN: automatic expense-item totals previously rounded KWD 0.001 to zero; totals and override detection now use the account currency minor units. Participant-only actions are tested separately from reassignment rights.
- Auth/TOTP/recovery destinations, token lifetime, invitation Retry-After, response errors, monetary precision, archive history, member pagination, all permission flags, late mutation identity and cross-space cancellation have named checks in the explicit suite.

### HTTP simulation

```sh
postman simulation run postman/simulations/space-finance.sim.yaml --port 4917
node --test postman/simulations/space-finance-client.test.mjs
```

Passed: 40 real HTTP calls through frontend clients; observed method/path/query/body field names checked against the sibling backend OpenAPI. Includes two spaces, balance/saving accounts and multiple currencies, income/expense, mixed-currency revenue null, transfer, all typed transaction details, plan execution with planned/actual amounts, financial/noncash repayments, cancellation and repeat-cancel 409, debt-linked income 409, archives with 204, includeArchived text, explicit report UTC dates, categories comma serialization, 403/404/503 rejection.

The Postman fixture is disposable and stateful. It verifies client integration and response parsing, not live backend ledger correctness, transaction atomicity, authorization enforcement or persistence. Reports in the fixture are deliberately simplified; historical report arithmetic is covered by focused view-model/ledger checks instead. Workspace discovery failed on the installed CLI macOS keychain session; no shared workspace was modified. Reproduction instructions: `postman/simulations/README.md`.

### Manual browser evidence

Vite served on localhost:5179 against the local Postman fixture only, with synthetic user/credentials and local-auth-token disabled.

- Registration contains name/email/password without currency, authenticates and reaches no-space selection. Profile identity, security and logout remain available.
- Create/directory/detail navigation and explicit activation were exercised. Creation leaves references empty. Created a balance account and an income with description, explicit account and date; refreshed balance and report income both show the confirmed amount.
- Two spaces with distinct data were selected/activated; an empty second space shows no first-space records. A digit-only ObjectId survives the URL unchanged.
- Joined an invitation with zero existing spaces and reached its explicit dashboard without prior space creation. URL fragment was removed before preview. Preview followed by accept 400 clears it and displays invalid invitation; 409 displays existing membership and a directory action.
- Loading labels were observed during invitation activation, followed by explicit empty states for accounts, incomes, plans, debts, expenses and reports.
- Revoked all four settings permissions in the fixture: member retained finance reads and create actions, while account/category/limit management controls disappeared.
- Simulated income POST 503: error is visible and account, description, amount and date remain in the form; no false success.
- Desktop and 320x900 layouts inspected. `document.documentElement.scrollWidth` equals clientWidth=320. Fixed budget-label/title overlap in operation dialogs. Income form labels and server-error copy remain readable.
- Last membership loss returned to `/main`, displayed the access-loss notice, removed finance widgets and retained the authenticated shell. Reopening `/main` after a confirmed selection restored its explicit URL. Browser Back restored the previous space; switching spaces retained selected January (verified with the rendered `data-selected` attribute). Malformed spaceId returned to selection. Directory/create/settings routes rendered the expected metadata, independent rights and member controls.
- Sanitized screenshots are in `screenshots/`; they contain synthetic names and values only. Viewport override was reset after mobile checks.

### Source/network audit

Runtime `src` (excluding tests/generated routes) has no groupId, ownerType, defaultCurrency/defaultAccountId, /groups, /snapshots or /incomes/revenue. Financial paths use mandatory `budgetPath`; typed detail/delete use income/expense/transfer resources. Retained `snapshotId` and local snapshot/timeline schema names describe optional response metadata and in-memory account history only, with no snapshot HTTP client. Transfer source/destination and space ownerId are intentional contract fields. Negative legacy fixtures and historical OpenSpec text are intentional.

### Limits

No live backend was started and no production requests were sent. Real delivery of invitations, live auth/TOTP and multi-client concurrency were not exercised; auth/TOTP transitions are covered by existing focused checks. Simulation/manual evidence cannot establish backend accounting or server authorization. The implementation and delta specs remain local and unarchived; no backend, main-spec or archived-change edits, commits, pushes or workspace publication.

## Final review

- `openspec validate migrate-frontend-to-spaces --strict`: passed.
- `git diff --check`: passed.
- Main specs and archived changes have no diff; pre-existing collection and plan/debt presentation work remains in place.
- Runtime source audit returned no removed endpoint/ownership/default-field references.
- Final checks: 189 named colocated checks passed; HTTP integration scenario passed with 40 calls.
- Planning artifacts, tasks, delta specs, implementation and this evidence describe the same space-only migration. Change is ready for review; sync/archive remains a separate user action.
