# Verification

## Logic checks

`node --test src/widgets/accounts/model/account-presentation.test.mjs` — 4 passed (Node 24.13.0).
Before implementation the command failed because the target module did not exist.
Covers active/type/default-currency/name/id ordering, empty groups, immutable inputs,
outgoing/incoming same- and cross-currency effects, date/id ordering and counterparty identity.

## Backend ordering

Read `../babki-back/src/modules/transactions/transfers/transfers.service.ts`, `findAll`:
`sort({ transactionDate: -1, _id: -1 })` precedes `skip(skip)` and `limit(limit)`.
Thus page 1 with limit 10 selects the latest 10 transfers for the account and period.
No backend changes required. Runtime checks are recorded below when performed.

## Test infrastructure

There is no `npm test` script or supported full-suite bare `node --test` command.
Only the explicit targeted commands in this document are claimed as test coverage.

## Widget checks

`node --test src/widgets/accounts/model/account-presentation.test.mjs src/widgets/accounts/accounts-widget.test.mjs`
— 5 passed. Main dashboard composition check now reads currency formatting from AccountRow.

Manual browser checks used `npm run dev` on a separate loopback port and a temporary synthetic
HTTP API (outside the repository), with an explicit dummy auth token. No real user data or tokens
were used. The API fixture has 12 October transfers, one archived counterparty, USD as the default
currency, two account types and RUB/USD accounts. Backend ordering was independently confirmed
in the real service source; live backend/database integration is not claimed.

- Closed account rows made no account-filtered transfer requests. Opening two rows produced
  exactly two queries with accountId, selected-month bounds, page=1 and limit=10; no page 2.
- The receiving account displayed October 12 through October 3, exactly 10 of 12 records.
  Outgoing RUB amounts were negative; incoming USD amounts had an explicit plus.
- The archived account was absent from overview rows, while its name was preserved in history.
- September selection retained both expansions and showed the empty-history message; requests
  used September 1–30, with no October operations displayed as September operations.
- Initial accounts loading exposed one aria-busy skeleton region. Empty accounts and archived-only
  responses showed the shared empty state and preserved the management action.
- Accounts/profile errors without cache showed local error and retry; retry restored content.
  Background account errors preserved the grouped list and balances.
- History errors without cache were local to both open panels and left balances visible.
  Background history errors preserved all 20 cached rows and showed two local retry controls.
- Enter expanded a row (`aria-expanded=true`); Space collapsed it (`aria-expanded=false`).
- At 390px viewport, document scrollWidth was 390px; signed amounts and dates remained readable.
  Screenshot: [mobile](screenshots/mobile.png), synthetic data only.

During month-switch verification the initial local row state was observed to reset when account
loading unmounted rows. Expansion state is now owned by Accounts and passed to each row;
the same month-switch reproduction passed after that change.

Independent code review found no actionable correctness or maintainability gaps.

## Final validation

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no problems found.
- `npm run build` — passed; Vite reports its bundle-size advisory for chunks over 500 kB.
- Targeted node command above — 5 passed after the final UI changes.
- `npm run dev -- --host 127.0.0.1 --port 5175` — ran for browser verification with synthetic
  API/auth environment overrides. Initial sandbox bind was denied; approved local execution worked.
- Through the real transfer dialogs against the synthetic API: editing the receiving amount
  from 20 to 25 updated the open panel to +25 USD; creating a 30 USD receiving effect showed
  +30 USD; deleting that synthetic transfer removed it from the panel. Account balances refreshed
  after each mutation. These verify frontend invalidation, not backend monetary calculations.
- The management dialog retained all five accounts, including the archived account, verified
  from its account-name input values.
- User refinement applied to proposal/spec/design/tasks and implementation: counterparty name
  has no direction prefix, amount shares its line, date is below. At 390px the first title and
  amount had identical y coordinates (1097.1953125); date y was 1119.7109375.
- Long names are truncated with the full counterparty name in title, keeping the summary compact.
  Responsive checks include 100-character valid account names at 320px.
- Final 320px check: all 10 history rows had identical title/amount y coordinates and equal
  clientWidth/scrollWidth (240px); document scrollWidth equaled viewport width (320px).
  Screenshot: [long names](screenshots/mobile-long-names.png), synthetic data only.
