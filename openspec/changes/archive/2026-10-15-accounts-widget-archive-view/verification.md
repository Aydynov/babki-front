# Verification

## Commands

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no problems.
- `npm run build` — passed; existing Vite warning about chunks above 500 kB remains.
- `git diff --check` — passed.
- `openspec validate accounts-widget-archive-view --strict` — passed.

Directed checks: 18 passed on Node 24.13.0:

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/features/manage-accounts/model/account-form.test.mjs \
  src/entities/accounts/model/account-eligibility.test.mjs \
  src/widgets/accounts/accounts-widget.test.mjs \
  src/widgets/accounts/model/account-presentation.test.mjs
```

The added archive-grouping check failed against the old active-only implementation and passed
after adding the mode filter. It checks grouping, currency/name/id ordering, empty archive,
active-account exclusion and unchanged input. Existing form and eligibility checks also pass.
The repository still has no general `npm test` script; this selected node:test command does not
establish that bare `node --test` is a supported repository-wide check.

## Browser verification

Started the development server with:

```sh
FRONT_BASE_API_URL=http://127.0.0.1:4174/api FRONT_USE_LOCAL_AUTH_TOKEN=false \
  npm run dev -- --host 127.0.0.1 --port 4174 --strictPort
```

Used separate headless Chrome with bundled Playwright on `/main`, intercepting only
`http://127.0.0.1:4174/api/**` with synthetic data. Real accounts and credentials were not used.
Browser scenarios were run from temporary local scripts, separate from the repository's node tests.
No JavaScript page errors were reported in the completed runs.

Checked at 1440×1000 and 390×844:

- Active mode is initially selected; archive button is left of the plus; archived rows are excluded.
- Keyboard Enter switches to archive and keeps focus on the same switch control; only archived rows
  are shown and the plus is absent from the DOM. Return restores active rows and prior expansion.
- Archived details open from the row with Enter. The selected month, historical balance and two
  empty-history states are displayed. Closing restores row focus and keeps archive selected.
- Archived management shows status, rename and delete, without repeated archival or default selection.
  Archived details omit creation of a new transfer; existing entity checks exclude archived accounts
  from new operations and default-account selection.
- Rename failure preserves the draft; retry sends only `name` and updates the list/details title.
  Escape while the request is pending keeps management open.
- Plus opens only the account creation form. Empty name, balance type, RUB default currency,
  an empty amount and the local opening date initialize correctly; no existing-account management appears.
- Invalid fractional precision prevents submission. Creation error preserves input, retry succeeds,
  resets the form and refreshes the active list. Pending blocks close/Escape and form inputs.
  Closing returns focus to the plus.
- Restricted deletion of an active account offers archival; cancelling sends no archive mutation.
  Confirmed archive removes the active row, closes all dialogs and returns focus to the archive switch.
- Deleting archived accounts, including the final one, retains archive mode, closes dialogs and
  focuses the return button. Empty archive displays «Архивных счетов нет», with no plus.
- Changing month preserves archive mode and changes the account query's end date. Details use the
  selected month. Archive mode remains selected through loading, error and retry.
- Long names remain readable through truncation; no horizontal page overflow on mobile.

## External creation and review

A separate read-only code review found a disconnected focus target: after creation from an empty
AccountSelect, refresh replaces its creation button with a select. A browser scenario reproduced
the failed focus restoration before the fix. Creation now resolves the focus target on close:
the original button when connected, otherwise the available select in the originating dialog.

Rechecked external creation through the real empty income AccountSelect in active and archive modes:
only one creation dialog opens; cancellation returns to the original button; successful creation
updates the originating form and closing focuses its new select. Archive mode never gains a plus.
Both runs completed without JavaScript page errors.

## Screenshots

- [Active, desktop](screenshots/active-desktop.png)
- [Archive, desktop](screenshots/archive-desktop.png)
- [Active, mobile](screenshots/active-mobile.png)
- [Archive, mobile](screenshots/archive-mobile.png)

## Limits

Browser checks use synthetic responses and establish frontend behavior, not live-backend correctness.
No new dependencies, API changes, routes or generated route files were introduced.
At implementation verification time the change was not yet archived or synced; the ordering note
for `account-details-dialog` was recorded in design.md and tasks.md.

## Creation form design refinement

All five requested refinements are recorded in the `personal-account-management` delta spec,
with proposal/design/tasks updated to match. The layout supersedes the initial creation layout
and its prefilled-zero behavior documented during the first implementation pass.

Browser checked on synthetic data at 1440×1000 and 390×844:

- Form has no additional enclosing border; the dialog remains its container.
- All five fields have visible associated labels, including «Начальная сумма» and «Дата открытия».
- Type and currency use the existing shared Select, with full-width triggers matching input height.
  Keyboard selected saving type; mouse selected USD; displayed values and outgoing payload matched.
- Initial amount is empty on first open, successful reset and reopening. Submitting it untouched
  sent numeric `amount: 0`, with the selected type/currency and current local opening date.
- Amount and date occupy separate full-width rows at both sizes. Precision error appears beneath
  amount and above date, spans field width, is associated through aria-describedby and sets aria-invalid.
  Excess precision blocks submission. No horizontal overflow or clipped feedback on mobile.
- Existing external creation from an empty income AccountSelect still works in active and archive
  modes; cancellation and successful creation restore focus to the button or replacement select.
- No JavaScript page errors in the completed browser runs.

The model check for empty amount confirms the existing conversion already returns numeric zero;
no payload-model change was needed. Directed suite: 18 passed. Lint, architecture, production build,
strict OpenSpec validation and diff whitespace checks passed again; existing bundle warning remains.

Screenshots: [desktop form](screenshots/creation-desktop.png),
[desktop precision error](screenshots/creation-error-desktop.png),
[mobile form](screenshots/creation-mobile.png),
[mobile precision error](screenshots/creation-error-mobile.png).

## Bulk spec sync and archive (2026-10-15)

Synced account-details-dialog first, then accounts-widget-archive-view. All five included deltas
were compared with main requirements and scenarios before archiving. The common widget spec
preserves the earlier details action and includes the later active/archive list behavior.

Reconciled Current account management in the main details spec with later implemented behavior:
separate creation from the active-list plus, archive-list access, and lifecycle focus returning
to the visible mode switch. Existing history, pagination and all 15 details scenarios remain.
All four affected main specs passed strict validation. All 16 main specs passed normal validation;
pre-existing Purpose-placeholder warnings remain in unrelated expense specs.
