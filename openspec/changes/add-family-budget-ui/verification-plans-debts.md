# Plans and debts implementation verification

Date: 2026-10-18. Scope: sections 7 and 8, owned plans/debts/debt-transactions entities, create/manage features, widgets.

## Implemented

- Separate group plan, debt and repayment schemas preserve ownership/actors without requiring personal userId or counters. Group debt create/update strip server-owned remaining/status, dueDate accepts null; repayment requires explicit isIncome and forbids accountId for noncash.
- Scope-bound API routes, AbortSignal reads, user/group-separated query keys and factories. POST retry disabled. Success/error reconciliation uses the captured scope and active identity guard; compound results update debt and repayment caches. Invalidation covers all financial caches in the original budget.
- Plans: paginated status/currency/archive filters; author/owner/manageTransactions actions; immutable currency, active category creation, prior archived category retained during metadata edits; one-time execution with currency-compatible active accounts; planned and fetched actual amounts; linked read-only expense details and unavailable expense state; confirmed archive/delete and read-only archive.
- Debts: “Нам должны” group label, optional creation deadline and explicit dueDate=null clearing, principal editable only after successful history total=0 (cancelled history counts), metadata editing, compatible repayment accounts, currency precision and overpayment checks. Paginated repayment history includes authors, cancellation dates/authors, income link IDs, financial flag and confirmed cancellation. Financial cancellation checks the linked income/account and is disabled for unavailable/archived accounts; noncash cancellation is independent. Archive/delete respect history/read-only rules.
- Forms display the captured budget title. Debt widget receives `babki:open-debt` CustomEvent<string>, fetches the detail in its captured budget, ignores responses after scope cleanup and shows an unavailable-record message without switching budgets.

## Executed checks

1. New group contract test first failed on missing group schemas, then passed after implementation.
2. Explicit supported command (Vite SSR loader for alias/TS contracts; native node:test for form helpers):

```sh
node --test src/entities/plans/model/*.test.mjs src/entities/debts/model/*.test.mjs src/features/create-plan/model/*.test.mjs src/features/create-debt/model/*.test.mjs src/features/manage-plan/model/*.test.mjs src/features/manage-debt/model/*.test.mjs
```

Result: 9 tests passed, 0 failed. Includes group DTOs, KWD 0.001 acceptance, nullable deadline, required boolean, noncash account prohibition, 100 planned/120 actual close payload without participantId, compound repayment response, group repayment/cancel routes, pagination and distinct personal/two-group keys, personal compatibility, permission matrix and compatible account selectors.

3. Scoped ESLint across all owned directories: passed with no errors or warnings.
4. `npx tsc -b --pretty false`: passed.
5. `npm run build`: passed. Vite reports existing large-chunk size warnings.
6. `npm run lint`: currently fails outside this ownership (345 errors/1 warning during concurrent integration); owned directories independently pass. Root owns final integration lint cleanup.
7. `npm run lint:architecture`: currently one inconsistent pluralization error for newly introduced budget slice; root is renaming it to budgets. No other architecture errors reported.

## Limits and outstanding browser acceptance

These are contract/component-policy checks, not end-to-end server or browser coverage. No common npm test runner is claimed. API adapter tests inspect outgoing requests and validated responses; they do not prove financial compensation or server concurrency enforcement. Browser verification was delegated to the root agent; this subtask did not mutate live financial data.

Still require integrated two-user/two-group browser acceptance: 320px/desktop layouts; loading/empty/error; concurrent/repeated close and cancellation409; lost POST response; revoked permission/membership; closed plan with deleted expense404; archived-account financial cancellation; principal edit after cancelled history; exact report/ledger/account effects and personal regressions. Root should merge this evidence and actual browser results into the final verification.md before marking acceptance tasks complete.
