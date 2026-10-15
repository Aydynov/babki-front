# Verification

## Implementation and browser checks

Implemented four unified cards: previous-year balances grouped by currency, and selected-year savings,
income and expenses as compact currency rows. Amounts remain independent; expense diff colors reverse
assessment while retaining the mathematical sign and arrow. Existing report helpers and calculations remain unchanged.

Used the existing checked-in Postman simulation, extended with the synthetic `flags.yearlyReports`
override and report delay. No private data or real credentials are used; nothing was published.

```sh
postman simulation run postman/simulations/monthly-incomes.sim.yaml \
  --port 4910 --no-history --output ndjson
FRONT_BASE_API_URL=http://127.0.0.1:4910/api FRONT_USE_LOCAL_AUTH_TOKEN=false \
  npm run dev -- --host 127.0.0.1 --port 4180 --strictPort
```

Headless Chrome with bundled Playwright verified `/` redirects to `/main` with a synthetic session.
The real frontend made HTTP requests to the local simulation; its temporary NDJSON log contains
`GET /reports/years`, `/users/me`, successful responses, and injected 500 responses.

Passed browser scenarios:
- Exactly four cards, with one title per block and all currencies visible.
- RUB default first, then EUR/JPY/USD in the selected year, including zero metric rows.
- Independent previous-year RUB/EUR/GBP/USD groups with their own balance and savings, without percentages.
- Expense +20% is red/up and -10% green/down; income and savings keep their normal colors.
- Zero current values and missing or zero comparison bases hide indicators; meaningful values compare same currency/year.
- Full amounts including 1,234,567,890.12, zero and zero-decimal JPY format in their own currencies.
- Desktop 1440px and widths 375, 640 and 768px; cards do not overflow, 375px stacks all four vertically.
- Switching 2026 → 2025 → 2024 changes currency sets and values without stale selected-year amounts.
- Empty selected-year report preserves a zero default-currency row; missing prior report displays an empty message.
- Existing prior report with no currencies preserves its zero default-currency group.
- Delayed initial report shows skeletons; initial report failure keeps all card titles and retry actions.
- Retry restores all shared report consumers; failed background report refresh retains cached values.
- Failed background user-metadata refresh retains valid amounts; retry restores the normal presentation.
- Existing monthly income actions remain available; no browser page errors were observed.

## Directed component checks

```sh
node --test src/shared/ui/currency-summary/currency-summary.test.mjs
```

2 tests passed: one card with independent full/zero amounts and expense coloring with unchanged
percent signs/arrows (both directions, normal and reversed colors). Tests were observed failing
before the component was created and passing afterward. These are directed SSR checks, not full
application test coverage. There is no general configured `npm test` command.

## Screenshots

- [Desktop](screenshots/desktop.png)
- [Mobile 375px](screenshots/mobile.png)

## Limits

Verification uses synthetic local HTTP responses, not a live backend. Monthly income presence is a
smoke regression check; complete monthly interaction scenarios are outside this UI change.

## Repository checks and review

- `npm run lint` — passed.
- `npm run lint:architecture` — passed, no problems.
- `npm run build` — passed; existing Vite warning about chunks above 500 kB remains.
- `openspec validate unify-annual-summary-widgets --strict` — passed.
- `git diff --check` — passed.

A separate read-only reviewer inspected changed and new files against the proposal, design and
specification, including cached/null/error states, comparison direction, currency periods and FSD.
No actionable findings were reported. Product changes are limited to the four annual widgets,
the shared presentation component. No API client, report schema,
calculation helper, monthly widget, chart or dependency changed; the only simulation change is
synthetic annual report configuration/delay for browser verification.


## Comparison caption removal

Removed the extra comparison caption at the user's request and deleted its unused translation key.
Updated design, spec and tasks to match. Browser verification confirmed the caption is absent while
currency rows and percentage indicators remain visible; desktop/mobile screenshots were refreshed.
Lint, architecture lint, build, strict OpenSpec validation and whitespace checks passed again.
