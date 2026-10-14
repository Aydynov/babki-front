# Verification

## Commands

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no problems.
- `npm run build` — passed. Vite reports a bundle-size warning for chunks above 500 kB.
- `openspec validate account-details-dialog --strict` — passed.
- Directed checks (18 passed):

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/entities/transactions/api/account-history.test.mjs \
  src/shared/lib/paginated-history/paginated-history.test.mjs \
  src/widgets/accounts/accounts-widget.test.mjs \
  src/widgets/accounts/model/account-presentation.test.mjs \
  src/features/manage-transfer/model/transfer-form.test.mjs
```

The project has no general `npm test` command. This is a selected node:test run, not a claim
that bare `node --test` works for the entire repository. The query integration check uses Vite SSR
and an isolated Axios adapter; it does not call the real backend.

## Browser verification

Started `npm run dev -- --host 127.0.0.1 --port 4174 --strictPort` with
`FRONT_BASE_API_URL=http://127.0.0.1:4174/api` and local-token mode disabled.
Used a separate headless Chrome with Playwright and intercepted API responses containing synthetic data.
No real tokens, private URLs, or financial records were used in screenshots or logs.

Checked on `/main` at 1440×1000 and 390×844:

- No details-history requests before opening the window.
- Existing arrow opens the short history without opening details.
- Enter on the account action opens details; Escape closes and returns focus.
- Existing expanded history remains open after closing details.
- 23 mixed income/expense records occupy three pages; 11 transfers occupy two.
- Navigating one table leaves the other table's page unchanged.
- Deletion failure leaves confirmation open; retry succeeds and an emptied last page clamps to page 1.
- Creation fixes the open account as source and displays its information read-only; submission was checked in the initial run.
- Escape during confirmed pending creation keeps the form open; one active account prevents submission.
- Editing an existing transfer succeeds and returns to account details.
- Successful deletion refreshes the displayed account balance and the counterparty balance.
- Reopening details resets both pages.
- Loading, empty, and error/retry states; failure of income/expense history leaves transfers available.
- Incoming USD transfers display the receiving amount with `+`; changing month updates the title
  and sends the account end date for that month.
- Archived and unknown counterparties retain a readable name or localized fallback.
- Long account/counterparty names do not overflow the mobile page.
- No horizontal page overflow on mobile; no browser page errors during the completed smoke run.

Screenshots: [desktop](screenshots/desktop.png), [mobile](screenshots/mobile.png).
The dialog uses internal vertical scrolling; the transfer table follows the income/expense table below the fold.

## Review and limitations

A separate read-only review found a race when creation opened before account eligibility loaded.
Creation now waits for account data; a regression check covers the opening guard.

Real-backend ordering is not verified. Both complete monthly histories are loaded and globally sorted
before local UI pagination, as allowed by the design's fallback. Very large monthly histories therefore
require more requests and memory. API snapshots across multiple requests are not available.


## Follow-up UI corrections

- Pagination uses chevron icon buttons with accessible labels and aligns right.
- Creation uses a plus icon next to the transfers heading, without a visible “New transfer” label.
- The source selector is replaced with read-only source balance/currency.
- Dialog and AlertDialog backdrops use Base UI forceRender so nested create/edit/delete windows
  dim the account window beneath them. Before the fix the browser found one backdrop; afterward
  it found two for each nested window.
- Rechecked pagination and nested create/edit/delete overlays at desktop and mobile widths;
  readonly source, absence of horizontal overflow and zero page errors confirmed.
- Re-ran all three repository validation commands and the 18 directed checks successfully.


## Current-account presentation refinements

The plus is adjacent to the transfers title. The creation source row shows “Списать с текущего счета”
and only the balance/currency on the right; it omits the account name. Missing destination feedback
reads “Выберите доступный счет”. All three repository validation commands passed again.
Browser verification on synthetic data confirmed adjacent title/button geometry, the new source row,
updated validation text, nested overlays and mobile layout with zero page errors.

## Current-account management

Added management scoped to the selected account via the existing feature. Browser checks on
synthetic data at desktop and mobile widths confirmed:

- Only the selected account appears; new-account creation remains in the global management window.
- Rename failure preserves the input; retry succeeds, updates the details title/row and retains the
  selected month and historical balance (12,345 RUB in the fixture versus current 80,000 RUB).
- Escape while renaming is pending leaves management open.
- Eligible active RUB balance accounts can become default; current default is marked and its
  selection button is disabled. A USD saving account has no default-selection action.
- Restricted deletion keeps confirmation open and offers archive confirmation. Cancelling it
  sends no archive request.
- Successful archive and delete close all modal layers; focus returns to global management.
  Restoring focus waits for nested dialogs' unmount focus cleanup to finish.
- Archived accounts remain visible in global management; deleted accounts disappear from the widget.
- Global management still displays all accounts and the new-account form.
- Nested management/confirmation backdrops are present, mobile has no horizontal overflow,
  and the browser reports zero page errors.

Screenshot: [current-account management](screenshots/account-management.png).

Validation rerun: lint, architecture lint, production build, strict OpenSpec validation and diff
whitespace check passed. The build retains its bundle-size warning. Directed checks: 16 passed:

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/features/manage-accounts/model/account-form.test.mjs \
  src/entities/accounts/model/account-eligibility.test.mjs \
  src/widgets/accounts/accounts-widget.test.mjs \
  src/widgets/accounts/model/account-presentation.test.mjs
```

A separate read-only review found no important actionable issues in scoped management. The
focus behavior was then tested and corrected in the browser. This does not add a general test runner.


## Lifecycle confirmation exit animation

Fixed the delete confirmation title switching to archive during dismissal: visibility is now
separate from the retained lifecycle action. A browser MutationObserver reproduced the old
“Удалить счёт?” → “Архивировать счёт?” change; after the fix, the title remains unchanged through
Cancel/Escape exit animations. Archive cancellation and reopening with a different action were
also checked; cancellation sends no mutation request. Browser page errors: zero.
