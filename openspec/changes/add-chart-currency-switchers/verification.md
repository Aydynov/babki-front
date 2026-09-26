# Verification

- `npm run lint`: passed.
- `npm run lint:architecture`: passed.
- `npm run build`: passed (existing Vite chunk-size advisory).
- `node --test src/features/select-chart-currency/model/*.test.mjs`: 8 passed.
- `git diff --check`: passed.
- `npm run dev`: checked `/main` with seeded August, September, and December 2026 data. Each selector changed only its own chart. Keyboard Down/Return selected USD. Monthly USD persisted from August to September; daily USD fell back to RUB and became disabled when September had only RUB. December displayed the daily empty state. Annual USD displayed a USD-formatted total. Other dashboard widgets retained RUB and USD sections. Loading transitions were visible. Headers fit at 390 px and 320 px, and the default desktop width.

The seeded data contains no empty report year or empty year-to-date monthly report, so those visual states could not be reached through the period control. Their availability and empty-list behavior are covered by the focused tests and code inspection. The API did not produce an error or background refetch failure during manual checking; existing full and compact error branches remain in each widget, with cached data retained for the compact branch. Browser console had no errors.

There is no supported repository-wide `npm test` command; the focused tests use `node --test` directly.
