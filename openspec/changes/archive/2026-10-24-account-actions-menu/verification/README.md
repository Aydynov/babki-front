# Verification — 2026-10-24

## Commands

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no FSD violations.
- `npm run build` — passed; Vite reports chunks above 500 kB.
- `node --test src/widgets/accounts/accounts-widget.test.mjs` — 4/4 passed.
- `openspec validate account-actions-menu --strict` — passed.
- `git diff --check` — passed.

The repository has no configured general test runner or npm test script. The four
colocated node tests check widget composition; they do not provide automated
interaction coverage. Browser checks below were performed manually through DOM
interaction in Chrome, including synthetic keyboard events.

## Browser checks

Vite started with `npm run dev -- --host 127.0.0.1`. On `/main`, selected a budget,
opened account details and checked the six facts, menu order, edit form contents
and return of focus to the dots after closing the form. No account mutation was
sent to the configured backend.

Remaining interactions used the real AccountDetailsDialog and management components
in `ui-check.html`, with synthetic query-cache data and in-memory mutation methods.
This verifies UI behavior, not backend responses or an end-to-end financial workflow.
Production query invalidation and historical-account query composition remain unchanged;
row refresh is preserved through that existing path, inspected in Accounts and the
account query module. The isolated form success updates its details title and retains
the historical amount and month.

| Case | Result |
| --- | --- |
| Active account menu | Edit, Archive, Delete in the requested order |
| Archived account menu | Edit and Delete only; status reads «в архиве» |
| No manageAccounts | No actions trigger; details remain readable |
| Edit form | Only name input with visible label, maxLength 100, Save and Close |
| Whitespace name | Save disabled |
| Save with surrounding spaces | Mutation receives only trimmed name and selected account id |
| Unchanged name | No mutation; form closes |
| Mutation error | Form remains open with input and local error |
| Pending save | Input, Save and Close disabled; Escape does not close |
| Cancel and reopen | Unsaved draft discarded; current saved name restored |
| Save success | Form closes, title updates, May 2025 and 1,234 RUB retained |
| Cancel lifecycle confirmation | No mutation; account details remain available |
| Restricted deletion | Active account offers Archive; archived account does not |
| Archive fallback | Switches confirmation to Archive; success invokes onUnavailable |
| Pending deletion | Buttons disabled, Escape blocked; success invokes onUnavailable |
| Keyboard menu | ArrowDown changes focused item; Escape closes menu and returns focus |
| Nested form focus | Closing form returns focus to dots in underlying details |
| History loading | Local busy state; six facts and account trigger remain available |
| History error | Retry shown for failed table; other table and account facts remain available |
| Empty histories | Both show their separate empty messages |
| Desktop | 1200 px viewport; dialogs have scrollWidth equal to clientWidth |
| Mobile | 388 × 842 iframe viewport; no document or dialog horizontal overflow; Save and Close visible |

## Reproduce isolated checks

With Vite running, open
`/openspec/changes/account-actions-menu/verification/ui-check.html`.
It renders synthetic data without using an account backend. Controls operate the
real components; `window.check` exposes calls and state for failure/pending checks.
For example, set `check.error = true` before saving; set `check.pending = true`
to hold a mutation, then `check.pending = false; check.release()` to finish it.
Set `check.allowed = false; check.render()` to inspect permissions.
For archived state, update `check.account.archivedAt`, then call `check.seed(); check.render()`.

Screenshots contain only synthetic data:

- `details-desktop.png`
- `edit-desktop.png`
- `edit-mobile.png`
