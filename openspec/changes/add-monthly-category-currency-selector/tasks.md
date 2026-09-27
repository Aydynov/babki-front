# Tasks

## 1. Currency control and selection

- [x] 1.1 Derive available currencies from positive-expense buckets in the selected month's report, add local selection, and place the existing selector beside category management with an accessible-label override; verify default selection, retained selection, fallback, keyboard operation, one-currency disabled state, and unchanged chart-control labels.

## 2. Monthly category presentation

- [x] 2.1 Replace repeated currency sections with one category list for the selected currency; verify every configured category still appears once, including zero-value categories, and only the selected currency changes in this card.
- [x] 2.2 Calculate category amounts and progress against the selected currency's monthly total; verify mixed-currency records never contribute to another currency's amounts or percentages.
- [x] 2.3 Show the in-card empty state with no selected currency when the month has no expenses, while preserving the management control and existing loading/error behavior; verify empty, initial loading, cached refresh, and recoverable error states.
- [x] 2.4 Read the selected month's currency and category totals from the year-to-date monthly reports query shared with the monthly chart; remove the expense-page loader and verify other months and zero-expense account currencies do not leak into the widget.

## 3. Integration verification

- [x] 3.1 Run `npm run lint`, `npm run lint:architecture`, and `npm run build`; verify all three commands pass.
- [x] 3.2 Run `npm run dev` and manually verify the monthly dashboard card with one currency, multiple currencies, no expenses, keyboard selection, and narrow responsive widths; confirm the annual and daily chart selectors remain independent and usable.
