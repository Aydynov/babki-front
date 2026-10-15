# Verification

## Result

Implemented the unified monthly income widget, independent currency row actions, five-row previews,
complete currency/month income dialog with ten-row pagination, and currency-scoped balance-account creation.
The expanded preview retains the amount-card source/date/amount table, typography, spacing, «всего:» and
full-month total; long values wrap on narrow screens. Account history uses the extracted shared table.

## Repository checks

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no problems.
- `npm run build` — passed. The pre-existing Vite warning about chunks above 500 kB remains.
- `openspec validate unify-monthly-incomes-widget --strict` — passed.
- `git diff --check` — passed.

Directed checks: 21 passed, no failures:

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/entities/incomes/api/income-history.test.mjs \
  src/entities/incomes/model/multicurrency-contract.test.mjs \
  src/features/create-income/model/create-income-form.test.mjs \
  src/shared/lib/paginated-history/paginated-history.test.mjs \
  src/entities/transactions/api/account-history.test.mjs \
  src/widgets/accounts/accounts-widget.test.mjs \
  src/widgets/accounts/model/account-presentation.test.mjs
```

The new query test runs the real Vite-loaded query and Axios client over loopback HTTP with synthetic,
paginated responses; it checks all pages, period/currency request filters, stable context keys,
the five newest values and rejection of an intermediate-page failure. The account eligibility test
checks saving, archived and other-currency exclusions and compatible default selection.
Both new behaviors were observed failing before their implementation and passing afterward.
The project still has no general `npm test` command; this is a directed run, not repository-wide coverage.

## Browser and HTTP simulation

Used installed Postman CLI 1.74.0 with the checked-in local simulation:

```sh
postman simulation run postman/simulations/monthly-incomes.sim.yaml \
  --port 4905 --no-history --output ndjson
```

Frontend command:

```sh
FRONT_BASE_API_URL=http://127.0.0.1:4905/api FRONT_USE_LOCAL_AUTH_TOKEN=false \
  npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
```

The mock is based on the existing frontend Zod contracts, with only synthetic users, accounts and income
records. The CLI is unauthenticated, so an owning-team published mock search was skipped; nothing was
published or deployed. The mock has local test-control endpoints `/api/__test/reset`,
`/api/__test/state` and `/api/__test/config` for switching fixture data, delay and failures.
Unmodeled API paths return 501. This is a focused dashboard simulation, not a complete backend contract.

Headless Chrome with Playwright drove `/main` at 1440×1000 and 390×844 against real HTTP simulation calls.
The following checks passed:

- No income-history requests before expansion or opening the currency details.
- RUB and USD can remain expanded together; each preview shows five operations of its own currency.
- Full monthly totals remain independent of the preview limit and visible in their currency rows.
- Keyboard activation opens details; Escape closes and returns focus without closing the preview.
- 112 USD incomes span two backend pages and twelve visible pages. Last page contains two rows;
  repeating the dialog starts on page one.
- Income rows from saving and archived accounts remain visible in the history; absent source/account
  names get readable fallback labels.
- Form selectors contain only active balance accounts in the row currency. Compatible default RUB
  account is preselected; USD form has no implicit first-account selection.
- Invalid precision disables submission. Successful USD creation sends `accountId` without a separate
  currency and refreshes complete history and totals; 113 records become visible after creation.
- Removing the selected eligible account while the form is open clears selection and blocks saving.
- Nested account creation preserves the income source field. A new RUB account does not satisfy the
  USD form; a new USD balance account becomes selectable without an arbitrary automatic selection.
- Initial structural loading, successful empty histories and zero-default-currency fallback preserve
  the widget shell. History and revenue failures show retry actions; successful retries restore data.
- A failed background history refresh keeps cached rows of the same context. Reducing 112 incomes
  to 11 clamps page twelve to page two.
- Changing the selected month with the dialog open resets to page one, changes the month description
  and presents only the newly selected month's records.
- Shared account-table regression: income/expense and transfer paginations remain independent;
  moving transfers to page two leaves the first table on its page. Reopening resets both, and the
  short account expansion remains open after closing details.
- Desktop and mobile state runs passed. Long content, nested account creation and pagination remain
  usable without horizontal page overflow; completed runs reported no browser page errors.

The simulation NDJSON log was inspected separately: it contains actual GET requests with period,
currency, `page=2&limit=100`, injected 500 responses and a successful `POST /incomes` with status 201.
Logs are temporary and are not committed.

## Screenshots

- [Expanded widget, desktop](screenshots/income-widget-desktop.png)
- [Expanded widget, mobile](screenshots/income-widget-mobile.png)
- [Income details, desktop](screenshots/income-details-desktop.png)
- [Income details, mobile](screenshots/income-details-mobile.png)

All screenshots use synthetic data and contain no real credentials or financial records.

## Review and limitations

A separate read-only code-review agent found no important actionable findings against the proposal,
design and delta specifications, including eligibility checks, shared table behavior, cache families,
partial history failures, accessibility and FSD boundaries.

Live backend behavior was not tested. The approved implementation loads complete monthly history
per currency on demand and sorts before local pagination; unusually large histories therefore cost
additional requests and memory. It does not provide a server-side snapshot across those requests.
No backend API, schema migration, new product dependency, editing or deletion of income was introduced.

## Monthly income comparison follow-up

Added a same-currency comparison with the previous complete calendar month through the existing revenue
endpoint and `getPercent`. Its percent format, sign, Body2 typography, success/destructive colors and
arrow size/stroke match CardAmount; it appears immediately after the currency code.

Browser checks against the local Postman simulation passed for +3%, -7%, equal totals, no current income,
missing and explicit zero previous totals, and January 2026 → December 2025. Comparison loading and an
injected previous-month-only 500 leave current rows/actions available; retry restores the indicator.
Desktop and 390px mobile checks passed without page errors or horizontal overflow. The browser check
first failed because the indicator was absent before implementation. Localized spacing before `%`
is retained from CardAmount's Intl formatter.

Updated proposal, design, monthly-income-presentation delta and tasks. Re-ran lint, architecture lint,
production build, strict OpenSpec validation and diff whitespace checks successfully; the existing
bundle-size warning remains. A separate follow-up review found no important actionable regressions.
Live backend behavior remains unverified.

Screenshot: [Currency comparison on mobile](screenshots/income-diff-mobile.png).

## Income dialog title refinement

Removed the duplicate visible title above the income table. The dialog header remains, and
the table retains its accessible caption/name. Account history section headings remain visible.
Browser checks confirmed this at desktop and mobile widths with no horizontal page overflow.
Updated the income dialog screenshots and the corresponding spec scenario/design.
Lint, architecture lint, production build, strict OpenSpec validation and diff whitespace checks passed;
the existing bundle-size warning remains.
